"""Offline archive checks; opt-in isolated PostgreSQL/MinIO durability contracts."""
from datetime import datetime, timedelta, timezone
import io
import os
from pathlib import Path
import stat
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch
import uuid
import zipfile

from agent.archive import content_hash, manifest, pack, restore
from agent.events import redact
from agent.storage import StorageError


def zipped(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data)
    return buffer.getvalue()


class ArchiveTests(unittest.TestCase):
    def test_roundtrip_binary_unicode_and_deleted_template_files(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / 'project'; root.mkdir()
            (root / 'source.txt').write_text('こんにちは café')
            (root / 'image.png').write_bytes(bytes(range(256)))
            (root / '.env').write_text('private')
            (root / 'node_modules').mkdir()
            (root / 'node_modules' / 'dependency').write_text('installed')
            archive = Path(folder) / 'project.zip'
            pack(root, archive)
            files = manifest(archive.read_bytes())
            self.assertEqual(set(files), {'source.txt', 'image.png'})
            (root / 'deleted.jsx').write_text('old template')
            (root / 'source.txt').unlink()
            restore(root, archive)
            self.assertFalse((root / 'deleted.jsx').exists())
            self.assertEqual((root / 'source.txt').read_text(), 'こんにちは café')
            self.assertEqual((root / 'image.png').read_bytes(), bytes(range(256)))
            self.assertTrue((root / 'node_modules' / 'dependency').exists())

    def test_content_identity_ignores_zip_order_but_includes_template(self):
        a = manifest(zipped({'a': b'one', 'b': b'two'}))
        b = manifest(zipped({'b': b'two', 'a': b'one'}))
        self.assertEqual(content_hash(a, 'template'), content_hash(b, 'template'))
        self.assertNotEqual(content_hash(a, 'template'), content_hash(a, 'other'))
        self.assertEqual(manifest(zipped({})), {})

    def test_rejects_paths_symlinks_duplicates_and_zip_bombs(self):
        for path in ('../escape', '/absolute', './alias', 'a//b', 'a/../b', 'a\\b', '.env', 'node_modules/a'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                manifest(zipped({path: b'x'}))
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as z:
            info = zipfile.ZipInfo('link'); info.external_attr = (stat.S_IFLNK | 0o777) << 16
            z.writestr(info, '/etc/passwd')
        with self.assertRaises(ValueError):
            manifest(buffer.getvalue())
        with self.assertRaises(ValueError):
            manifest(zipped({'a': b'x', 'a/b': b'y'}))
        with self.assertRaises(ValueError):
            manifest(zipped({str(i): b'' for i in range(251)}))
        with patch('agent.archive.MAX_BYTES', 100), self.assertRaises(ValueError):
            manifest(zipped({'bomb': b'x' * 101}))

    def test_changes_during_pack_do_not_publish_a_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'source').write_text('original')
            with patch('agent.archive.workspace_files', side_effect=[{'source': {'size': 8, 'sha256': 'wrong'}}, {}]):
                with self.assertRaises(ValueError):
                    pack(root, root / 'archive.zip')

    def test_redacts_before_durable_logging(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'private-provider-value'}):
            result = redact({'output': 'private-provider-value postgres://user:pass@host/db token=abcdef',
                             'authorization': 'secret header', 'safe': True})
        self.assertNotIn('private-provider-value', result['output'])
        self.assertNotIn('user:pass', result['output'])
        self.assertNotIn('abcdef', result['output'])
        self.assertNotIn('authorization', result)
        self.assertTrue(result['safe'])


@unittest.skipUnless(os.getenv('RUN_PERSISTENCE_TESTS') == '1', 'Opt-in isolated PostgreSQL persistence tests')
class PersistenceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from db.base import AsyncSessionLocal, engine, Base
        from db.models import User, Chat, Run
        self.assertIn('webbuilder_test', engine.url.database)
        await engine.dispose()
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        self.chat_id, self.run_id = str(uuid.uuid4()), str(uuid.uuid4())
        async with AsyncSessionLocal.begin() as db:
            self.user = User(email=f'{uuid.uuid4()}@example.org', name='Storage test', hashed_password='unused', email_verified=True)
            db.add(self.user); await db.flush()
            db.add(Chat(id=self.chat_id, user_id=self.user.id, title='Durable project')); await db.flush()
            db.add(Run(id=self.run_id, chat_id=self.chat_id, prompt='test', status='running'))
        self.objects = {}
        async def put(key, data, *args): self.objects[key] = data
        async def read(key, size):
            if key not in self.objects: raise StorageError('missing')
            return self.objects[key]
        self.put = patch('agent.persistence.put_object', new=AsyncMock(side_effect=put))
        self.read = patch('agent.persistence.read_object', new=AsyncMock(side_effect=read))
        self.upload = self.put.start(); self.read.start()
        self.data = zipped({'package-lock.json': b'{}', 'source': b'hello', 'asset.png': bytes(range(256))})

    async def asyncTearDown(self):
        from db.base import AsyncSessionLocal, engine
        from db.models import User
        from sqlalchemy import delete
        async with AsyncSessionLocal.begin() as db:
            await db.execute(delete(User).where(User.id == self.user.id))
        self.put.stop(); self.read.stop()
        await engine.dispose()

    async def save(self, data=None):
        from agent.persistence import save_revision
        return await save_revision(self.chat_id, self.run_id, data if data is not None else self.data, 'template')

    async def test_dedupe_restart_and_file_access_without_sandbox(self):
        from agent.persistence import latest_revision, revision_bytes
        from db.base import AsyncSessionLocal
        from main import get_project_files, get_file_content, download_all_files
        first, _ = await self.save()
        second, _ = await self.save()
        self.assertEqual(first, second); self.assertEqual(self.upload.await_count, 1)
        self.assertEqual(await revision_bytes(await latest_revision(self.chat_id)), self.data)
        async with AsyncSessionLocal() as db:
            files = await get_project_files(self.chat_id, self.user, db)
            self.assertFalse(files['sandbox_active'])
            result = await get_file_content(self.chat_id, 'asset.png', True, None, self.user, db)
            self.assertEqual(result.body, bytes(range(256)))
            result = await download_all_files(self.chat_id, None, self.user, db)
            self.assertEqual(result.body, self.data)

    async def test_upload_failure_keeps_previous_checkpoint_and_failed_draft_unverified(self):
        from agent.persistence import latest_revision
        from db.base import AsyncSessionLocal
        from db.models import Chat
        first, _ = await self.save()
        self.upload.side_effect = StorageError('storage offline')
        with self.assertRaises(StorageError): await self.save(zipped({'source': b'new'}))
        self.assertEqual((await latest_revision(self.chat_id)).id, first)
        async with AsyncSessionLocal() as db:
            self.assertIsNone((await db.get(Chat, self.chat_id)).latest_verified_revision_id)

    async def test_upload_commit_gap_recovery_and_stale_parent_rejection(self):
        from agent.persistence import latest_revision, promote, revision_bytes
        from db.base import AsyncSessionLocal
        from db.models import ProjectRevision
        from sqlalchemy import select
        await self.save()
        with patch('agent.persistence.promote', new=AsyncMock(side_effect=StorageError('simulated crash'))):
            with self.assertRaises(StorageError): await self.save(zipped({'source': b'pending'}))
        async with AsyncSessionLocal() as db:
            pending = await db.scalar(select(ProjectRevision).where(ProjectRevision.chat_id == self.chat_id, ProjectRevision.status == 'pending'))
        await revision_bytes(pending)
        await promote(pending.id)
        self.assertEqual((await latest_revision(self.chat_id)).id, pending.id)
        with patch('agent.persistence.promote', new=AsyncMock(side_effect=StorageError('simulated crash'))):
            with self.assertRaises(StorageError): await self.save(zipped({'source': b'stale'}))
        async with AsyncSessionLocal() as db:
            stale = await db.scalar(select(ProjectRevision).where(ProjectRevision.chat_id == self.chat_id, ProjectRevision.status == 'pending'))
        latest, _ = await self.save(zipped({'source': b'latest'}))
        with self.assertRaises(StorageError): await promote(stale.id)
        self.assertEqual((await latest_revision(self.chat_id)).id, latest)

    async def test_corrupt_object_and_cross_owner_are_rejected(self):
        from agent.persistence import latest_revision, revision_bytes
        from main import get_project_files
        from fastapi import HTTPException
        from db.base import AsyncSessionLocal
        await self.save()
        revision = await latest_revision(self.chat_id)
        self.objects[revision.object_key] = b'corrupt'
        with self.assertRaises(StorageError): await revision_bytes(revision)
        async with AsyncSessionLocal() as db:
            with self.assertRaises(HTTPException) as error:
                await get_project_files(self.chat_id, SimpleNamespace(id=-1), db)
        self.assertEqual(error.exception.status_code, 404)

    async def test_event_is_committed_before_publish_and_replays_in_order(self):
        from agent.service import Service, LiveRun
        from agent.events import run_events
        from db.base import AsyncSessionLocal
        from db.models import RunEvent
        service = Service(); live = LiveRun(self.run_id, self.chat_id, 'test')
        observed = []
        service.publish = lambda chat, event: observed.append(event)
        await service.emit(live, 'stage', message='saved first')
        async with AsyncSessionLocal() as db:
            persisted = await db.get(RunEvent, (self.run_id, 1))
            self.assertEqual(observed[0], persisted.payload)
            self.assertEqual(await run_events(db, self.run_id, 1), [])
        with patch('agent.service.AsyncSessionLocal.begin', side_effect=RuntimeError('database down')):
            with self.assertRaises(RuntimeError): await service.emit(live, 'stage', message='must not publish')
        self.assertEqual(len(observed), 1)

    async def test_retention_protects_saved_and_verified_revisions(self):
        from agent.maintenance import maintain
        from db.base import AsyncSessionLocal
        from db.models import Chat, ProjectRevision, Run
        from sqlalchemy import select
        ids = []
        for i in range(7):
            revision_id, _ = await self.save(zipped({'source': str(i).encode()}))
            ids.append(revision_id)
        async with AsyncSessionLocal.begin() as db:
            chat = await db.get(Chat, self.chat_id)
            chat.latest_verified_revision_id = ids[0]
            run = await db.get(Run, self.run_id)
            run.status = 'failed'; run.finished_at = datetime.now(timezone.utc)
            for i, revision_id in enumerate(ids):
                row = await db.get(ProjectRevision, revision_id)
                row.created_at = datetime.now(timezone.utc) - timedelta(days=2, seconds=7-i)
        with patch('agent.maintenance.archive_run', new=AsyncMock()), patch('agent.maintenance.storage_call', new=AsyncMock()):
            await maintain(SimpleNamespace(active={}, opening=set()))
        async with AsyncSessionLocal() as db:
            remaining = set((await db.scalars(select(ProjectRevision.id).where(ProjectRevision.chat_id == self.chat_id))).all())
        self.assertIn(ids[0], remaining)
        self.assertIn(ids[-1], remaining)
        self.assertNotIn(ids[1], remaining)
        self.assertEqual(len(remaining), 6)

    async def test_terminal_recovers_sequence_after_uncertain_commit(self):
        from agent.service import Service, LiveRun
        from db.base import AsyncSessionLocal
        from db.models import RunEvent, Run, Chat
        service = Service(); live = LiveRun(self.run_id, self.chat_id, 'test')
        revision_id, _ = await self.save(); live.revision_id = revision_id
        async with AsyncSessionLocal.begin() as db:
            db.add(RunEvent(run_id=self.run_id, sequence=1, payload={'e': 'stage', 'sequence': 1}))
        # LiveRun deliberately has no event: simulate cancellation after commit, before append.
        await service.finish(live, 'succeeded', 'Verified and saved', {'url': 'https://preview.example.org'})
        async with AsyncSessionLocal() as db:
            terminal = await db.get(RunEvent, (self.run_id, 2))
            self.assertEqual(terminal.payload['e'], 'run_finished')
            self.assertEqual((await db.get(Run, self.run_id)).status, 'succeeded')
            self.assertEqual((await db.get(Chat, self.chat_id)).latest_verified_revision_id, revision_id)


@unittest.skipUnless(os.getenv('RUN_MINIO_TESTS') == '1', 'Opt-in local MinIO contract')
class MinioContractTests(unittest.TestCase):
    def test_private_immutable_object_roundtrip(self):
        from agent.storage import ObjectStore
        from urllib.parse import urlparse
        self.assertEqual(os.environ['STORAGE_PROVIDER'], 'minio')
        self.assertIn(urlparse(os.environ['MINIO_ENDPOINT']).hostname, {'localhost', '127.0.0.1'})
        store = ObjectStore(); key = f'tests/{uuid.uuid4()}.zip'
        data = zipped({'binary': bytes(range(256))})
        try:
            store.put(key, data); store.put(key, data)
            self.assertEqual(store.read(key), data)
            with self.assertRaises(StorageError): store.put(key, b'different')
            self.assertEqual(store.read(key), data)
        finally:
            store.delete(key)


if __name__ == '__main__':
    unittest.main()
