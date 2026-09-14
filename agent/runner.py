"""One editing conversation with shared budgets and host-controlled verification."""
import json
import os
import shlex
import time
from collections import Counter
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.utils.function_calling import convert_to_openai_tool
from .prompts import SYSTEM_PROMPT
from .tools import WorkspaceTools, list_files
from .context import CONTEXT_RULES, choose_files
from .skills import RuntimeSkills
from .public_tools import encode_public, public_tool_details, preflight_failure
from .preview import control_preview


class RunLimitError(Exception):
    pass


class VerificationError(Exception):
    pass


class SandboxSetupError(VerificationError):
    pass


def estimate_input_tokens(model, messages, tool_schema: str) -> tuple[int, str]:
    try:
        # LangChain counts message/tool-call text but not bound tool definitions.
        count = model.get_num_tokens_from_messages(messages) + model.get_num_tokens(tool_schema)
        estimator = 'tokenizer'
    except (NotImplementedError, ValueError):
        # Unsupported tokenizers or special-token literals must still have a bound.
        count = sum(len(str(m.content).encode()) +
                    len(str(getattr(m, 'tool_calls', '')).encode()) + 100 for m in messages)
        count += len(tool_schema.encode())
        estimator = 'bytes_fallback'
    # Allow for provider-specific message and tool framing; this is an estimate.
    return count + 2000, estimator


async def check_browser(workspace: WorkspaceTools, *, preflight: bool = False) -> dict:
    script = Path(__file__).with_name('browser-check.cjs').read_text()
    # Execute directly: overwriting the shared /tmp checker can fail with permission denied.
    command = 'PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node -e ' + shlex.quote(script)
    return await workspace.command(command + (' -- --preflight' if preflight else ''), timeout=45)


async def verify(workspace: WorkspaceTools) -> dict:
    build = await workspace.command('npm run build', timeout=90)
    if not build['ok']:
        return {'ok': False, 'build': build, 'browser': {'checked': False}}
    if workspace.preview_revision != workspace.revision:
        # Flush server-side module state after the complete edit, not every file.
        # Infrastructure failures escape the model repair loop.
        await control_preview(workspace.sandbox, 'restart')
        workspace.preview_revision = workspace.revision
    browser = await check_browser(workspace)
    return {'ok': browser['ok'], 'build': build, 'browser': browser}


async def run_editor(sandbox, prompt, emit, checkpoint, metrics, model=None, memory=None):
    workspace = WorkspaceTools(sandbox)
    await emit('stage', message='Checking sandbox browser tools')
    metrics['sandbox_check'] = await check_browser(workspace, preflight=True)
    if not metrics['sandbox_check']['ok']:
        category, explanation = preflight_failure(metrics['sandbox_check'])
        diagnostic = public_tool_details('browser_preflight', result=metrics['sandbox_check'])
        diagnostic['error_category'] = category
        await emit('verification', ok=False, message=explanation, checks=diagnostic)
        raise SandboxSetupError(explanation)
    await emit('verification', ok=True, message='Sandbox browser startup check passed')
    if model is None:
        from .agent import llm
        model = llm
    tools = {t.name: t for t in workspace.definitions()}
    skills = RuntimeSkills()
    skill_prompt = skills.prompt()
    if skill_prompt:
        skill_tool = skills.tool()
        tools[skill_tool.name] = skill_tool
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
    formatted_tools = [convert_to_openai_tool(t) for t in tools.values()]
    bound = model.bind_tools(formatted_tools, parallel_tool_calls=False)
    tool_schema = json.dumps(formatted_tools, ensure_ascii=False)
    messages = [SystemMessage(content=SYSTEM_PROMPT + '\n' + CONTEXT_RULES + skill_prompt +
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
        estimated_input, estimator = estimate_input_tokens(model, messages, tool_schema)
        # Keep room for a useful response without always demanding the full 8k output ceiling.
        output_limit = min(8192, token_budget - metrics.get('total_tokens', 0) -
                           metrics.get('reserved_tokens', 0) - estimated_input - 1)
        if output_limit < 1024:
            metrics['token_budget'] = {'stage': 'preflight', 'limit': token_budget,
                'used': metrics.get('total_tokens', 0), 'reserved': metrics.get('reserved_tokens', 0),
                'estimated_input': estimated_input, 'output_reserve': 1024, 'estimator': estimator}
            raise RunLimitError('Token budget reached')
        response = await bound.ainvoke(messages, max_tokens=output_limit)
        usage = response.usage_metadata or {}
        for key in ('input_tokens', 'output_tokens', 'total_tokens'):
            metrics[key] = metrics.get(key, 0) + usage.get(key, 0)
        if metrics.get('total_tokens', 0) + metrics.get('reserved_tokens', 0) >= token_budget:
            metrics['token_budget'] = {'stage': 'provider_usage', 'limit': token_budget,
                'used': metrics.get('total_tokens', 0), 'reserved': metrics.get('reserved_tokens', 0)}
            raise RunLimitError('Token budget reached')
        metadata = response.response_metadata
        if (metadata.get('incomplete_details') or {}).get('reason') == 'max_output_tokens' or metadata.get('finish_reason') == 'length':
            metrics['token_budget'] = {'stage': 'model_output', 'limit': token_budget,
                'used': metrics.get('total_tokens', 0), 'output_limit': output_limit}
            raise RunLimitError('Model output budget reached; request a smaller change')
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
            await emit('tool_started', call_id=call_id, name=call['name'],
                       details=public_tool_details(call['name'], args=call['args']))
            started = time.monotonic()
            try:
                if call['name'] not in tools:
                    raise ValueError('Unknown tool')
                result = await tools[call['name']].ainvoke(call['args'])
            except Exception as exc:
                result = {'ok': False, 'error': str(exc)[:2000]}
            duration = round((time.monotonic() - started) * 1000)
            serialized = json.dumps(result, ensure_ascii=False)
            detail = public_tool_details(call['name'], args=call['args'], result=result)
            # Keep valid JSON for old clients; new clients consume the structured projection.
            await emit('tool_completed', call_id=call_id, name=call['name'], ok=bool(result.get('ok')),
                       duration_ms=duration, details=detail, output=encode_public(detail))
            messages.append(ToolMessage(content=serialized, tool_call_id=call_id, status='success' if result.get('ok') else 'error'))
        await checkpoint(workspace.revision != before_revision)
    raise RunLimitError('Model-turn budget reached')
