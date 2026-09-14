"""Project deletion regressions with fake database/storage/provider responses only."""
import asyncio
import os
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, call, patch

from agent.maintenance import attempt_cleanup, cleanup_project_storage, maintain
from agent.persistence import put_object
from agent.sandbox_runtime import SandboxRuntimes
from agent.storage import ObjectStore, StorageError
from db.models import StorageDeletion

with patch.dict(os.environ, {'SECRET_KEY': 'local-test-only-secret-with-at-least-32-characters'}):
    import main


class StorageDeletionTests(unittest.TestCase):
    def store(self, provider):
        store = ObjectStore.__new__(ObjectStore)
        store.provider, store.bucket, store.client = provider, 'private-test-bucket', MagicMock()
        return store

    def test_gcs_removes_all_exact_generations_only(self):
        store = self.store('gcs')
        blobs = [SimpleNamespace(name=name, generation=generation, delete=MagicMock())
                 for name, generation in [('revision.zip', 1), ('revision.zip', 2), ('revision.zip.other', 3)]]
        store.client.list_blobs.return_value = iter(blobs)
        store.delete('revision.zip')
        for blob in blobs[:2]:
            blob.delete.assert_called_once_with(if_generation_match=blob.generation, timeout=20)
        blobs[2].delete.assert_not_called()

    def test_gcs_missing_generation_is_idempotent(self):
        from google.api_core.exceptions import NotFound
        store = self.store('gcs')
        blob = SimpleNamespace(name='key', generation=1, delete=MagicMock(side_effect=NotFound('gone')))
        store.client.list_blobs.return_value = [blob]
        store.delete('key')

    def test_minio_removes_versions_and_markers_across_pages(self):
        store = self.store('minio')
        store.client.get_paginator.return_value.paginate.return_value = [
            {'Versions': [{'Key': 'key', 'VersionId': 'null'}, {'Key': 'key-other', 'VersionId': '1'}]},
            {'Versions': [{'Key': 'key', 'VersionId': '2'}],
             'DeleteMarkers': [{'Key': 'key', 'VersionId': '3'}]},
        ]
        store.delete('key')
        self.assertEqual(store.client.delete_object.call_args_list, [
            call(Bucket=store.bucket, Key='key', VersionId=value) for value in ['null', '2', '3']])

    def test_provider_failure_remains_an_error_for_retry(self):
        store = self.store('gcs')
        store.client.list_blobs.side_effect = RuntimeError('private provider details')
        with self.assertRaisesRegex(StorageError, '^Private storage delete failed$'):
            store.delete('key')


class ProjectDeletionTests(unittest.IsolatedAsyncioTestCase):
    def service(self):
        return SimpleNamespace(admission=asyncio.Lock(), opening=set(), active={}, retire_sandbox=AsyncMock())

    async def test_deletion_locks_owner_before_collecting_keys(self):
        db, service = AsyncMock(), self.service()
        db.add = MagicMock()
        db.scalar.return_value = SimpleNamespace(id='project')
        db.scalars.return_value = SimpleNamespace(all=lambda: [])
        db.execute.return_value = SimpleNamespace(all=lambda: [])
        async def list_keys(_):
            query = str(db.scalar.await_args.args[0])
            self.assertIn('FOR UPDATE', query)
            self.assertIn('chats.user_id', query)
            return SimpleNamespace(all=lambda: [])
        db.scalars.side_effect = list_keys
        with patch.object(main, 'agent_service', service), \
             patch.object(main, 'cleanup_project_storage', new=AsyncMock(return_value=True)):
            await main.delete_project('project', SimpleNamespace(id=7), db)

    async def test_ownership_failure_does_not_delete_or_retire(self):
        db, service = AsyncMock(), self.service()
        with patch.object(main, 'agent_service', service), \
             patch.object(main, 'owned_chat', new=AsyncMock(side_effect=main.HTTPException(404, 'Not found'))):
            with self.assertRaises(main.HTTPException):
                await main.delete_project('project', object(), db)
        db.execute.assert_not_awaited()
        service.retire_sandbox.assert_not_awaited()

    async def test_active_operation_prevents_deletion(self):
        for opening in [True, False]:
            db, service = AsyncMock(), self.service()
            if opening:
                service.opening.add('project')
            else:
                service.active['run'] = SimpleNamespace(chat_id='project')
            with patch.object(main, 'agent_service', service), \
                 patch.object(main, 'owned_chat', new_callable=AsyncMock):
                with self.assertRaises(main.HTTPException) as error:
                    await main.delete_project('project', object(), db)
            self.assertEqual(error.exception.status_code, 409)
            db.execute.assert_not_awaited()

    async def test_queues_every_saved_and_pending_key_before_retirement(self):
        db, service = AsyncMock(), self.service()
        db.add = MagicMock()
        db.scalars.return_value = SimpleNamespace(all=lambda: ['revision.zip'])
        db.execute.return_value = SimpleNamespace(all=lambda: [('run-1', 'old-log.gz'), ('run-2', None)])
        order = []
        db.commit.side_effect = lambda: order.append('commit')
        async def retire(_):
            order.append('retire')
            return True
        service.retire_sandbox.side_effect = retire
        async def cleanup(keys):
            self.assertEqual(order[0], 'commit')
            self.assertEqual(set(keys), {args.args[0].object_key for args in db.add.call_args_list})
            return True
        with patch.object(main, 'agent_service', service), \
             patch.object(main, 'owned_chat', new_callable=AsyncMock), \
             patch.object(main, 'cleanup_project_storage', side_effect=cleanup):
            result = await main.delete_project('project', object(), db)
        keys = {args.args[0].object_key for args in db.add.call_args_list}
        self.assertEqual(keys, {'revision.zip', 'old-log.gz', 'logs/run-1.jsonl.gz',
                                'logs/run-2.jsonl.gz', 'legacy/project'})
        self.assertTrue(all(isinstance(args.args[0], StorageDeletion) for args in db.add.call_args_list))
        self.assertEqual(order, ['commit', 'retire'])
        self.assertEqual(result, {'deleted': True, 'storage_cleanup': 'completed',
                                  'sandbox_cleanup': 'completed'})

    async def test_slow_storage_does_not_prevent_sandbox_cleanup(self):
        db, service = AsyncMock(), self.service()
        db.add = MagicMock()
        db.scalars.return_value = SimpleNamespace(all=lambda: [])
        db.execute.return_value = SimpleNamespace(all=lambda: [])
        service.retire_sandbox.return_value = True
        async def slow_cleanup(_):
            await asyncio.Event().wait()
        with patch.object(main, 'agent_service', service), \
             patch.object(main, 'owned_chat', new_callable=AsyncMock), \
             patch.object(main, 'cleanup_project_storage', side_effect=slow_cleanup), \
             patch('agent.maintenance.CLEANUP_TIMEOUT', 0.01):
            result = await main.delete_project('project', object(), db)
        self.assertEqual(result, {'deleted': True, 'storage_cleanup': 'queued',
                                  'sandbox_cleanup': 'completed'})
        service.retire_sandbox.assert_awaited_once_with('project')

    async def test_sandbox_failure_keeps_successful_file_result(self):
        db, service = AsyncMock(), self.service()
        db.add = MagicMock()
        db.scalars.return_value = SimpleNamespace(all=lambda: [])
        db.execute.return_value = SimpleNamespace(all=lambda: [])
        service.retire_sandbox.side_effect = RuntimeError('private provider details')
        with patch.object(main, 'agent_service', service), \
             patch.object(main, 'owned_chat', new_callable=AsyncMock), \
             patch.object(main, 'cleanup_project_storage', new=AsyncMock(return_value=True)):
            result = await main.delete_project('project', object(), db)
        self.assertEqual(result, {'deleted': True, 'storage_cleanup': 'completed',
                                  'sandbox_cleanup': 'queued'})

    async def test_cleanup_failure_does_not_block_other_keys(self):
        db = AsyncMock()
        db.scalars.side_effect = [SimpleNamespace(all=lambda: ['failed.zip', 'good.zip'])] + [
            SimpleNamespace(all=lambda: []) for _ in range(4)]
        factory = MagicMock()
        factory.return_value.__aenter__.return_value = db
        factory.begin.return_value.__aenter__.return_value = db
        cleanup = AsyncMock(side_effect=[StorageError('temporary failure'), None])
        with patch('agent.maintenance.AsyncSessionLocal', factory), \
             patch('agent.maintenance.storage_call', cleanup):
            await maintain(SimpleNamespace(active={}, opening=set()))
        self.assertEqual(cleanup.await_args_list, [call('delete', 'failed.zip'), call('delete', 'good.zip')])
        # Only the successful key's cleanup intent is removed.
        deleted_keys = [args.args[0].compile().params.get('object_key_1')
                        for args in db.execute.await_args_list]
        self.assertIn('good.zip', deleted_keys)
        self.assertNotIn('failed.zip', deleted_keys)


class UploadDeletionRaceTests(unittest.IsolatedAsyncioTestCase):
    def database(self, owner):
        db = AsyncMock()
        db.get.return_value = owner
        factory = MagicMock()
        factory.return_value.__aenter__.return_value = db
        factory.begin.return_value.__aenter__.return_value = db
        return db, factory

    async def test_upload_after_project_deletion_never_reaches_storage(self):
        _, factory = self.database(None)
        with patch('agent.persistence.AsyncSessionLocal', factory), \
             patch('agent.persistence.storage_call', new_callable=AsyncMock) as write:
            with self.assertRaisesRegex(StorageError, 'Project was deleted'):
                await put_object('key', b'files', chat_id='project')
        write.assert_not_awaited()

    async def test_cancelled_upload_finishes_before_object_deletion(self):
        _, factory = self.database(object())
        loop, started, release = asyncio.get_running_loop(), asyncio.Event(), threading.Event()
        operations = []
        store = MagicMock()
        def put(*args):
            loop.call_soon_threadsafe(started.set)
            if not release.wait(3):
                raise RuntimeError('Test upload was not released')
            operations.append('put')
        store.put.side_effect = put
        store.delete.side_effect = lambda _: operations.append('delete')
        with patch('agent.persistence.AsyncSessionLocal', factory), \
             patch('agent.maintenance.AsyncSessionLocal', factory), \
             patch('agent.persistence.reserve_transfer', new_callable=AsyncMock), \
             patch('agent.storage.ObjectStore', return_value=store):
            caller = asyncio.create_task(put_object('key', b'files', chat_id='project'))
            try:
                await asyncio.wait_for(started.wait(), 2)
                caller.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await caller
                with patch('agent.maintenance.CLEANUP_TIMEOUT', 0.01):
                    self.assertFalse(await attempt_cleanup(cleanup_project_storage(['key'])))
                store.delete.assert_not_called()
                factory.begin.assert_not_called()  # Timeout keeps the durable retry record.
            finally:
                release.set()
            self.assertTrue(await cleanup_project_storage(['key']))
        self.assertEqual(operations, ['put', 'delete'])


class SandboxDeletionTests(unittest.IsolatedAsyncioTestCase):
    async def test_failed_kill_retains_runtime_and_retry_removes_it(self):
        runtimes = SandboxRuntimes()
        row = SimpleNamespace(chat_id='project', sandbox_id='sandbox', operation_id='operation')
        runtimes.get = AsyncMock(return_value=row)
        runtimes.change = AsyncMock()
        runtimes.remove = AsyncMock()
        with patch('agent.sandbox_runtime.AsyncSandbox.kill', new=AsyncMock(
                side_effect=[RuntimeError('provider unavailable'), False])) as kill:
            self.assertFalse(await runtimes.retire('project'))
            runtimes.change.assert_awaited_with(row, state='retiring', reusable=False)
            runtimes.remove.assert_not_awaited()
            self.assertTrue(await runtimes.retire('project'))
            runtimes.remove.assert_awaited_once_with(row)
            self.assertEqual(kill.await_count, 2)

    async def test_kill_timeout_keeps_runtime_for_retry(self):
        runtimes = SandboxRuntimes()
        row = SimpleNamespace(chat_id='project', sandbox_id='sandbox', operation_id='operation')
        runtimes.get = AsyncMock(return_value=row)
        runtimes.change = AsyncMock()
        runtimes.remove = AsyncMock()
        async def slow_kill(*args, **kwargs):
            await asyncio.Event().wait()
        with patch('agent.sandbox_runtime.AsyncSandbox.kill', side_effect=slow_kill), \
             patch('agent.maintenance.CLEANUP_TIMEOUT', 0.01):
            self.assertFalse(await attempt_cleanup(runtimes.retire('project')))
        runtimes.change.assert_awaited_once_with(row, state='retiring', reusable=False)
        runtimes.remove.assert_not_awaited()
