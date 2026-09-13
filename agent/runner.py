"""One editing conversation with shared budgets and host-controlled verification."""
import json
import os
import shlex
import time
from collections import Counter
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from .prompts import SYSTEM_PROMPT
from .tools import WorkspaceTools, list_files
from .context import CONTEXT_RULES, choose_files


class RunLimitError(Exception):
    pass


class VerificationError(Exception):
    pass


class SandboxSetupError(VerificationError):
    pass


async def check_browser(workspace: WorkspaceTools, *, preflight: bool = False) -> dict:
    script = Path(__file__).with_name('browser-check.cjs').read_text()
    # Execute directly: overwriting the shared /tmp checker can fail with permission denied.
    command = 'PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node -e ' + shlex.quote(script)
    return await workspace.command(command + (' -- --preflight' if preflight else ''), timeout=45)


async def verify(workspace: WorkspaceTools) -> dict:
    build = await workspace.command('npm run build', timeout=90)
    if not build['ok']:
        return {'ok': False, 'build': build, 'browser': {'checked': False}}
    browser = await check_browser(workspace)
    return {'ok': browser['ok'], 'build': build, 'browser': browser}


async def run_editor(sandbox, prompt, emit, checkpoint, metrics, model=None, memory=None):
    workspace = WorkspaceTools(sandbox)
    await emit('stage', message='Checking sandbox browser tools')
    metrics['sandbox_check'] = await check_browser(workspace, preflight=True)
    if not metrics['sandbox_check']['ok']:
        raise SandboxSetupError(
            'Sandbox browser tools are unavailable. Check E2B_TEMPLATE_ID and use the '
            'webbuilder-react-verified template with Playwright and Chromium installed. '
            'No model request was made for this run.')
    if model is None:
        from .agent import llm
        model = llm
    tools = {t.name: t for t in workspace.definitions()}
    if memory is not None:
        history_tool = memory.tool()
        tools[history_tool.name] = history_tool
    max_turns = int(os.getenv('RUN_MAX_TURNS', '16'))
    max_calls = int(os.getenv('RUN_MAX_TOOL_CALLS', '32'))
    token_budget = int(os.getenv('RUN_MAX_TOKENS', '100000'))
    max_repairs = 2
    context = await memory.build(prompt, model, metrics, token_budget) if memory is not None else {}
    paths = await list_files(sandbox)
    initial = {}
    for path in choose_files(paths, prompt, context):
        try:
            content = await workspace.read(path)
            encoded = content.encode()
            initial[path] = {'content': encoded[:4000].decode('utf-8', errors='ignore'),
                             'truncated': len(encoded) > 4000}
        except Exception:
            initial[path] = {'error': 'Unable to read; inspect with tools before editing'}
    bound = model.bind_tools(list(tools.values()), parallel_tool_calls=False)
    messages = [SystemMessage(content=SYSTEM_PROMPT + '\n' + CONTEXT_RULES +
        '\nInitial files may be excerpts. Read complete files before replacing them.'),
        HumanMessage(content=json.dumps({'project_context': context, 'request': prompt,
                                        'files': initial, 'paths': paths}, ensure_ascii=False))]
    repeated = Counter()
    repairs = 0
    for turn in range(max_turns):
        metrics['turns'] = turn + 1
        await emit('stage', message='Implementing changes' if not repairs else 'Repairing verification errors')
        await checkpoint()
        # Bound growing conversation inputs as well as measured provider usage.
        if sum(len(str(m.content)) for m in messages) > 180_000:
            raise RunLimitError('Context budget reached; request a smaller change')
        estimated_input = sum(len(str(m.content).encode()) + len(str(getattr(m, 'tool_calls', '')).encode()) + 100 for m in messages) + sum(len(json.dumps(t.args).encode()) for t in tools.values()) + 2000
        if metrics.get('total_tokens', 0) + metrics.get('reserved_tokens', 0) + estimated_input + 8192 >= token_budget:
            raise RunLimitError('Token budget reached')
        response = await bound.ainvoke(messages)
        usage = response.usage_metadata or {}
        for key in ('input_tokens', 'output_tokens', 'total_tokens'):
            metrics[key] = metrics.get(key, 0) + usage.get(key, 0)
        if metrics.get('total_tokens', 0) + metrics.get('reserved_tokens', 0) >= token_budget:
            raise RunLimitError('Token budget reached')
        messages.append(response)
        if response.invalid_tool_calls:
            raise VerificationError('Model returned an invalid tool call')
        if not response.tool_calls:
            await emit('stage', message='Checking production build and browser')
            checks = await verify(workspace)
            metrics['checks'] = checks
            await emit('verification', ok=checks['ok'], message='Build and browser smoke passed' if checks['ok'] else 'Verification failed', checks=checks)
            await checkpoint()
            if checks['ok']:
                return {'summary': response.text()[:1500] or 'Application updated.',
                        'url': 'https://' + sandbox.get_host(5173)}
            if repairs >= max_repairs:
                raise VerificationError('Build or browser checks still fail after two repair passes')
            repairs += 1
            metrics['repairs'] = repairs
            messages.append(HumanMessage(content='Fix only these verification errors: ' + json.dumps(checks)))
            continue
        before_revision = workspace.revision
        for call in response.tool_calls:
            metrics['tool_calls'] = metrics.get('tool_calls', 0) + 1
            if metrics['tool_calls'] > max_calls:
                raise RunLimitError('Tool-call budget reached')
            fingerprint = (call['name'], json.dumps(call['args'], sort_keys=True))
            # Reads are deduplicated until a mutation; other repeated operations are bounded globally.
            key = (*fingerprint, workspace.revision if call['name'] == 'read_files' else 0)
            repeated[key] += 1
            if repeated[key] >= 3:
                raise RunLimitError('Stopped repetitive tool calls without progress')
            call_id = call['id']
            await emit('tool_started', call_id=call_id, name=call['name'])
            started = time.monotonic()
            try:
                if call['name'] not in tools:
                    raise ValueError('Unknown tool')
                result = await tools[call['name']].ainvoke(call['args'])
            except Exception as exc:
                result = {'ok': False, 'error': str(exc)[:2000]}
            duration = round((time.monotonic() - started) * 1000)
            serialized = json.dumps(result, ensure_ascii=False)
            # File contents belong in model context, not the user activity log.
            detail = {'files': list(result['files'])} if 'files' in result else result
            if call['name'] == 'search_project_history':
                detail = {'ok': bool(result.get('ok')),
                          'message_ids': [m['id'] for m in result.get('messages', [])]}
            await emit('tool_completed', call_id=call_id, name=call['name'], ok=bool(result.get('ok')), duration_ms=duration, output=json.dumps(detail, ensure_ascii=False)[-2000:])
            messages.append(ToolMessage(content=serialized, tool_call_id=call_id, status='success' if result.get('ok') else 'error'))
        await checkpoint(workspace.revision != before_revision)
    raise RunLimitError('Model-turn budget reached')
