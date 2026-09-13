"""Offline lifecycle regressions: python -m unittest discover -s sandbox/tests."""
from types import SimpleNamespace
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import AsyncMock, patch

from agent import preview_process
from agent.preview import PreviewError
from agent.runner import verify
from agent.service import Service


class VerificationTests(unittest.IsolatedAsyncioTestCase):
    def workspace(self, revision=1, build_ok=True):
        return SimpleNamespace(sandbox=object(), revision=revision, preview_revision=0,
                               command=AsyncMock(return_value={'ok': build_ok}))

    async def test_edit_restarts_once_before_browser_check(self):
        workspace = self.workspace()
        order = []

        async def control(*args):
            order.append('restart')

        async def browser(*args):
            order.append('browser')
            return {'ok': True}

        with patch('agent.runner.control_preview', side_effect=control) as restart, \
             patch('agent.runner.check_browser', side_effect=browser):
            self.assertTrue((await verify(workspace))['ok'])
            await verify(workspace)
            restart.assert_awaited_once_with(workspace.sandbox, 'restart')
        self.assertEqual(order, ['restart', 'browser', 'browser'])

    async def test_no_mutation_does_not_restart(self):
        with patch('agent.runner.control_preview', new_callable=AsyncMock) as restart, \
             patch('agent.runner.check_browser', new=AsyncMock(return_value={'ok': True})):
            await verify(self.workspace(revision=0))
            restart.assert_not_awaited()

    async def test_failed_build_does_not_restart_or_check_browser(self):
        with patch('agent.runner.control_preview', new_callable=AsyncMock) as restart, \
             patch('agent.runner.check_browser', new_callable=AsyncMock) as browser:
            self.assertFalse((await verify(self.workspace(build_ok=False)))['ok'])
            restart.assert_not_awaited()
            browser.assert_not_awaited()

    async def test_restart_failure_cannot_mark_revision_fresh(self):
        workspace = self.workspace()
        with patch('agent.runner.control_preview', new=AsyncMock(side_effect=PreviewError('failed'))), \
             patch('agent.runner.check_browser', new_callable=AsyncMock) as browser:
            with self.assertRaises(PreviewError):
                await verify(workspace)
            browser.assert_not_awaited()
        self.assertEqual(workspace.preview_revision, 0)

    async def test_browser_failure_still_fails_a_successful_build(self):
        with patch('agent.runner.control_preview', new_callable=AsyncMock), \
             patch('agent.runner.check_browser', new=AsyncMock(return_value={'ok': False})):
            self.assertFalse((await verify(self.workspace()))['ok'])


class RestoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_unhealthy_resume_restarts_same_sandbox_only_once(self):
        service = Service()
        sandbox = object()
        service.require_sandbox_capacity = AsyncMock()
        service.get_e2b_sandbox = AsyncMock(return_value=sandbox)
        service.preview_ready = AsyncMock(side_effect=PreviewError('unhealthy'))
        service.retire_sandbox = AsyncMock()
        service.runtimes.get = AsyncMock(return_value=SimpleNamespace(reusable=True))
        with patch('agent.service.ensure_revision', new=AsyncMock(return_value=object())), \
             patch('agent.service.control_preview', new_callable=AsyncMock) as control:
            with self.assertRaises(PreviewError):
                await service.open_preview('project')
            control.assert_awaited_once_with(sandbox, 'restart')
        service.get_e2b_sandbox.assert_awaited_once_with('project')
        self.assertEqual(service.preview_ready.await_count, 2)
        self.assertNotIn('project', service.opening)

    async def test_unhealthy_new_restore_is_not_restarted_again(self):
        service = Service()
        service.require_sandbox_capacity = AsyncMock()
        service.get_e2b_sandbox = AsyncMock(return_value=object())
        service.preview_ready = AsyncMock(side_effect=PreviewError('unhealthy'))
        service.retire_sandbox = AsyncMock()
        service.runtimes.get = AsyncMock(return_value=SimpleNamespace(reusable=False))
        with patch('agent.service.ensure_revision', new=AsyncMock(return_value=object())), \
             patch('agent.service.control_preview', new_callable=AsyncMock) as control:
            with self.assertRaises(PreviewError):
                await service.open_preview('project')
            control.assert_not_awaited()

    async def test_restore_stops_before_replacing_files_and_starts_after_install(self):
        order = []
        sandbox = SimpleNamespace(commands=SimpleNamespace(run=AsyncMock()))
        revision = SimpleNamespace(manifest={'package-lock.json': {}})
        service = Service()
        service.runtimes.acquire = AsyncMock(return_value=(sandbox, True))

        async def control(_, action):
            order.append(action)

        async def archive(*args):
            order.append('restore')

        async def command(cmd, **kwargs):
            if cmd.startswith('npm ci'):
                order.append('install')

        sandbox.commands.run.side_effect = command
        with patch('agent.service.ensure_revision', new=AsyncMock(return_value=revision)), \
             patch('agent.service.revision_bytes', new=AsyncMock(return_value=b'archive')), \
             patch('agent.service.sandbox_archive', side_effect=archive), \
             patch('agent.service.control_preview', side_effect=control):
            self.assertIs(await service.get_e2b_sandbox('project'), sandbox)
        self.assertEqual(order, ['stop', 'restore', 'install', 'start'])

    async def test_reusable_runtime_does_not_restart_or_restore(self):
        sandbox = object()
        service = Service()
        service.runtimes.acquire = AsyncMock(return_value=(sandbox, False))
        with patch('agent.service.ensure_revision', new=AsyncMock()), \
             patch('agent.service.control_preview', new_callable=AsyncMock) as control, \
             patch('agent.service.sandbox_archive', new_callable=AsyncMock) as archive:
            self.assertIs(await service.get_e2b_sandbox('project'), sandbox)
            control.assert_not_awaited()
            archive.assert_not_awaited()


class ProcessTests(unittest.TestCase):
    def test_only_explicit_preview_port_is_recognized(self):
        with TemporaryDirectory() as directory:
            root = (Path(directory) / 'project').resolve()
            vite = root / 'node_modules/vite/bin/vite.js'
            vite.parent.mkdir(parents=True)
            vite.touch()
            processes = Path(directory) / 'proc'
            process = processes / '123'
            process.mkdir(parents=True)
            (process / 'cwd').symlink_to(root)
            cases = [
                ([b'--port', b'5173'], [123]),
                ([b'--port', b'3000'], []),
                ([b'--port'], []),
                ([], []),
                ([b'--port', b'3000', b'--port', b'5173'], []),
            ]
            with patch.object(preview_process, 'ROOT', root), \
                 patch.object(preview_process, 'VITE', vite), \
                 patch.object(preview_process, 'Path', side_effect=lambda value: processes if value == '/proc' else Path(value)):
                for arguments, expected in cases:
                    with self.subTest(arguments=arguments):
                        (process / 'cmdline').write_bytes(b'\0'.join([b'node', str(vite).encode(), *arguments, b'']))
                        self.assertEqual(list(preview_process.project_servers()), expected)

    def test_duplicate_server_is_rejected_before_spawn(self):
        with patch.object(preview_process, 'project_servers', return_value=iter([123])), \
             patch.object(preview_process.subprocess, 'Popen') as spawn:
            with self.assertRaisesRegex(RuntimeError, 'duplicate'):
                preview_process.start()
            spawn.assert_not_called()

    def test_unknown_port_owner_is_not_killed_or_replaced(self):
        with patch.object(preview_process, 'project_servers', return_value=iter([])), \
             patch.object(preview_process.Path, 'is_file', return_value=True), \
             patch.object(preview_process.socket, 'socket') as socket, \
             patch.object(preview_process.subprocess, 'Popen') as spawn:
            socket.return_value.__enter__.return_value.bind.side_effect = OSError('port busy')
            with self.assertRaises(OSError):
                preview_process.start()
            spawn.assert_not_called()


if __name__ == '__main__':
    unittest.main()
