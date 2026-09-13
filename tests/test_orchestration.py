import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from langchain_core.messages import AIMessage
from agent.runner import run_editor, RunLimitError, VerificationError, SandboxSetupError, check_browser, verify
from e2b import SandboxException
from agent.tools import WorkspaceTools, project_path
from agent.service import Service, LiveRun


class FakeSandbox:
    def __init__(self):
        self.data = {'package.json': '{}'}
        self.files = SimpleNamespace(read=AsyncMock(side_effect=self.read), write=AsyncMock(side_effect=self.write))
        self.commands = SimpleNamespace(run=AsyncMock(return_value=SimpleNamespace(exit_code=0, stdout='[]', stderr='')))
        self.kill = AsyncMock()
    async def read(self, path):
        return self.data.get(path.removeprefix('/home/user/react-app/'), '')
    async def write(self, path, data):
        self.data[path.removeprefix('/home/user/react-app/')] = data
    def get_host(self, port):
        return 'preview.example.org'


class Model:
    def __init__(self, responses): self.responses = iter(responses)
    def bind_tools(self, *args, **kwargs): return self
    async def ainvoke(self, messages): return next(self.responses)


def reply(calls=None):
    return AIMessage(content='Updated', tool_calls=calls or [], usage_metadata={'input_tokens': 10, 'output_tokens': 5, 'total_tokens': 15})


class ToolTests(unittest.IsolatedAsyncioTestCase):
    async def test_browser_checks_do_not_overwrite_shared_temporary_file(self):
        sandbox = FakeSandbox()
        sandbox.files.write.side_effect = PermissionError('shared temporary file')
        workspace = WorkspaceTools(sandbox)
        preflight = await check_browser(workspace, preflight=True)
        first = await verify(workspace)
        second = await verify(workspace)
        self.assertTrue(preflight['ok'])
        self.assertTrue(first['ok'])
        self.assertTrue(second['ok'])
        sandbox.files.write.assert_not_awaited()

    async def test_typed_unicode_batch_and_cache_invalidation(self):
        sandbox = FakeSandbox(); workspace = WorkspaceTools(sandbox)
        tools = {t.name: t for t in workspace.definitions()}
        text = 'const s = "こんにちは café \\n";'
        await tools['write_files'].ainvoke({'files': [{'path': 'src/Home.jsx', 'content': text}]})
        self.assertEqual(sandbox.data['src/Home.jsx'], text)
        self.assertEqual(await workspace.read('src/Home.jsx'), text)
        self.assertEqual(sandbox.files.read.await_count, 0)
        await tools['execute_command'].ainvoke({'command': 'ls src'})
        await workspace.read('src/Home.jsx')
        self.assertEqual(sandbox.files.read.await_count, 1)

    async def test_paths_and_duplicate_writes_rejected(self):
        for path in ('../secret', '/etc/passwd', '.env', '.env.local', 'src/../../etc', 'node_modules/a'):
            with self.assertRaises(ValueError): project_path(path)
        tool = WorkspaceTools(FakeSandbox()).definitions()[1]
        with self.assertRaises(ValueError):
            await tool.ainvoke({'files': [{'path': 'a', 'content': '1'}, {'path': 'a', 'content': '2'}]})

    async def test_failed_build_is_not_success(self):
        sandbox = FakeSandbox()
        sandbox.commands.run.return_value = SimpleNamespace(exit_code=1, stdout='', stderr='Compilation failed')
        result = await verify(WorkspaceTools(sandbox))
        self.assertFalse(result['ok']); self.assertFalse(result['browser']['checked'])
        self.assertEqual(sandbox.commands.run.call_args.args[0], 'npm run build')

    async def test_error_result_contains_exit_code(self):
        sandbox = FakeSandbox()
        error = RuntimeError('command failed'); error.exit_code = 7; error.stderr = 'bad import'
        sandbox.commands.run.side_effect = error
        self.assertEqual((await WorkspaceTools(sandbox).command('npm run build'))['exit_code'], 7)


class RunnerTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_browser_tools_stop_before_model_request(self):
        sandbox = FakeSandbox()
        sandbox.commands.run.return_value = SimpleNamespace(
            exit_code=1, stdout='', stderr='Cannot find module playwright')
        model = SimpleNamespace(bind_tools=Mock())
        metrics = {}
        with self.assertRaisesRegex(SandboxSetupError, 'No model request'):
            await run_editor(sandbox, 'portfolio', AsyncMock(), AsyncMock(), metrics, model)
        model.bind_tools.assert_not_called()
        self.assertFalse(metrics['sandbox_check']['ok'])
        self.assertNotIn('repairs', metrics)
        self.assertTrue(sandbox.commands.run.call_args.args[0].endswith(' --preflight'))

    async def test_sandbox_failure_has_safe_actionable_terminal_reason(self):
        service = Service(); service.emit = AsyncMock()
        live = LiveRun('run', 'chat', 'portfolio')
        sandbox = FakeSandbox()
        service.get_e2b_sandbox = AsyncMock(return_value=sandbox)
        service.finish = AsyncMock()
        service.save_files = AsyncMock()
        with patch('agent.service.run_editor', new=AsyncMock(
                side_effect=SandboxException('private provider request'))):
            await service.execute(live)
        reason = service.finish.call_args.args[2]
        self.assertIn('sandbox', reason)
        self.assertNotIn('private provider request', reason)
        self.assertEqual(live.metrics['error_type'], 'SandboxException')
        sandbox.kill.assert_awaited_once()

    async def test_repair_is_bounded_and_checks_are_real_gate(self):
        with patch('agent.runner.verify', new=AsyncMock(return_value={'ok': False, 'build': {'stderr': 'bad'}})) as check:
            with self.assertRaises(VerificationError):
                await run_editor(FakeSandbox(), 'counter', AsyncMock(), AsyncMock(), {}, Model([reply()] * 4))
            self.assertEqual(check.await_count, 3)

    async def test_repeated_reads_stop(self):
        responses = [reply([{'name': 'read_files', 'args': {'paths': ['package.json']}, 'id': str(i), 'type': 'tool_call'}]) for i in range(3)]
        with self.assertRaises(RunLimitError):
            await run_editor(FakeSandbox(), 'counter', AsyncMock(), AsyncMock(), {}, Model(responses))

    async def test_tool_errors_not_labelled_success(self):
        calls = [{'name': 'write_files', 'args': {'files': [{'path': '../x', 'content': 'bad'}]}, 'id': 'bad-call', 'type': 'tool_call'}]
        events = AsyncMock()
        with patch('agent.runner.verify', new=AsyncMock(return_value={'ok': True})):
            await run_editor(FakeSandbox(), 'counter', events, AsyncMock(), {}, Model([reply(calls), reply()]))
        complete = [c for c in events.call_args_list if c.args[0] == 'tool_completed']
        self.assertFalse(complete[0].kwargs['ok'])
        self.assertEqual(complete[0].kwargs['call_id'], 'bad-call')

    async def test_cancel_kills_sandbox_and_persists_terminal(self):
        service = Service(); service.emit = AsyncMock(); live = LiveRun('run', 'chat', 'counter'); sandbox = FakeSandbox()
        service.get_e2b_sandbox = AsyncMock(return_value=sandbox)
        service.finish = AsyncMock(); service.save_files = AsyncMock()
        entered = asyncio.Event()
        async def blocked(*args, **kwargs): entered.set(); await asyncio.Future()
        with patch('agent.service.run_editor', new=blocked):
            service.active[live.id] = live
            live.task = asyncio.create_task(service.execute(live))
            await entered.wait(); await service.cancel(live.id)
        sandbox.kill.assert_awaited_once()
        service.save_files.assert_not_awaited()
        self.assertEqual(service.finish.call_args.args[1], 'cancelled')
        self.assertNotIn(live.id, service.active)

    async def test_slow_subscriber_does_not_block_run(self):
        service = Service(); service.emit = AsyncMock(); queue = asyncio.Queue(maxsize=1)
        service.subscribers['chat'] = {queue}
        service.publish('chat', {'e': 'one'}); service.publish('chat', {'e': 'two'})
        self.assertEqual(queue.get_nowait()['e'], 'resync')

    async def test_cancel_before_task_starts_still_finishes(self):
        service = Service(); service.emit = AsyncMock(); live = LiveRun('run', 'chat', 'counter')
        service.finish = AsyncMock()
        service.active[live.id] = live
        live.task = asyncio.create_task(service.execute(live))
        await service.cancel(live.id)
        self.assertEqual(service.finish.call_args.args[1], 'cancelled')
        self.assertFalse(service.active)

    async def test_cancel_during_restore_kills_registered_sandbox(self):
        service = Service(); service.emit = AsyncMock(); live = LiveRun('run', 'chat', 'counter'); sandbox = FakeSandbox()
        service.finish = AsyncMock(); entered = asyncio.Event()
        async def restoring(chat_id):
            service.sandboxes[chat_id] = sandbox
            entered.set()
            await asyncio.Future()
        service.get_e2b_sandbox = restoring
        service.active[live.id] = live
        live.task = asyncio.create_task(service.execute(live))
        await entered.wait(); await service.cancel(live.id)
        sandbox.kill.assert_awaited_once()
        self.assertFalse(service.sandboxes)

    async def test_timeout_kills_external_work_and_records_terminal_state(self):
        service = Service(); service.emit = AsyncMock(); live = LiveRun('run', 'chat', 'counter'); sandbox = FakeSandbox()
        service.get_e2b_sandbox = AsyncMock(return_value=sandbox)
        service.finish = AsyncMock()
        async def blocked(*args, **kwargs): await asyncio.Future()
        with patch.dict('os.environ', {'RUN_TIMEOUT_SECONDS': '1'}), patch('agent.service.run_editor', new=blocked):
            await service.execute(live)
        sandbox.kill.assert_awaited_once()
        self.assertEqual(service.finish.call_args.args[1], 'timed_out')


if __name__ == '__main__': unittest.main()
