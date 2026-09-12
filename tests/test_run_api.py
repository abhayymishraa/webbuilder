"""Integration checks require an isolated PostgreSQL DB, never a production URL."""
import asyncio
import os
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from test_orchestration import FakeSandbox


@unittest.skipUnless(os.getenv('RUN_DATABASE_TESTS') == '1', 'Opt-in isolated PostgreSQL integration tests')
class RunAPITests(unittest.TestCase):
    def setUp(self):
        from main import app
        from agent.service import agent_service
        from db.base import engine
        self.assertIn('webbuilder_test', engine.url.database)
        self.service = agent_service
        async def blocked(*args): await asyncio.Future()
        self.runner = patch('agent.service.run_editor', new=blocked)
        self.sandbox = patch.object(agent_service, 'get_e2b_sandbox', new=AsyncMock(return_value=FakeSandbox()))
        self.runner.start(); self.sandbox.start()
        self.client = TestClient(app).__enter__()
        import uuid
        self.email = f'{uuid.uuid4().hex}@example.org'
        r = self.client.post('/auth/register', json={'email': self.email, 'name': 'Run tests', 'password': 'local-only-test-password'})
        self.assertEqual(r.status_code, 201)
        login = self.client.post('/auth/login', json={'email': self.email, 'password': 'local-only-test-password'}).json()
        self.token = login['access_token']; self.headers = {'Authorization': 'Bearer '+self.token}

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.sandbox.stop(); self.runner.stop()

    def test_disconnect_preserves_run_cancel_is_durable_and_rejected_request_free(self):
        r = self.client.post('/chat', json={'prompt': 'A counter'}, headers=self.headers)
        self.assertEqual(r.status_code, 200); run = r.json(); chat = run['chat_id']
        before = self.client.get('/auth/me', headers=self.headers).json()['tokens_remaining']
        rejected = self.client.post(f'/chats/{chat}/runs', json={'prompt': 'Another counter'}, headers=self.headers)
        self.assertEqual(rejected.status_code, 409)
        self.assertEqual(self.client.get('/auth/me', headers=self.headers).json()['tokens_remaining'], before)
        with self.client.websocket_connect('/ws/'+chat) as ws:
            ws.send_json({'type': 'auth', 'token': self.token})
            snapshot = ws.receive_json(); self.assertEqual(snapshot['type'], 'history')
            self.assertEqual(snapshot['runs'][0]['status'], 'running')
        status = self.client.get(f'/chats/{chat}/runs', headers=self.headers).json()
        self.assertEqual(status['runs'][0]['status'], 'running')
        stopped = self.client.post('/runs/'+run['run_id']+'/cancel', headers=self.headers)
        self.assertEqual(stopped.status_code, 200)
        self.assertEqual(stopped.json()['runs'][0]['status'], 'cancelled')
        with self.client.websocket_connect('/ws/'+chat) as ws:
            ws.send_json({'type': 'auth', 'token': self.token})
            self.assertEqual(ws.receive_json()['runs'][0]['status'], 'cancelled')

    def test_cross_owner_file_and_cancel_access_denied(self):
        run = self.client.post('/chat', json={'prompt': 'A counter'}, headers=self.headers).json()
        import uuid
        email = f'{uuid.uuid4().hex}@example.org'
        self.client.post('/auth/register', json={'email': email, 'name': 'Other', 'password': 'local-only-test-password'})
        token = self.client.post('/auth/login', json={'email': email, 'password': 'local-only-test-password'}).json()['access_token']
        other = {'Authorization': 'Bearer '+token}
        for path in [f"/projects/{run['chat_id']}/files", f"/chats/{run['chat_id']}/runs"]:
            self.assertEqual(self.client.get(path, headers=other).status_code, 404)
        self.assertEqual(self.client.post('/runs/'+run['run_id']+'/cancel', headers=other).status_code, 404)
        self.client.post('/runs/'+run['run_id']+'/cancel', headers=self.headers)

    def test_capacity_rejection_does_not_charge_credit(self):
        before = self.client.get('/auth/me', headers=self.headers).json()['tokens_remaining']
        with patch.dict(os.environ, {'MAX_CONCURRENT_RUNS': '0'}):
            response = self.client.post('/chat', json={'prompt': 'A counter'}, headers=self.headers)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(self.client.get('/auth/me', headers=self.headers).json()['tokens_remaining'], before)

    def test_malformed_websocket_auth_is_rejected(self):
        from starlette.websockets import WebSocketDisconnect
        for frame in ([], {'type': 'auth', 'token': 123}, {'type': 'auth', 'token': 'invalid'}):
            with self.client.websocket_connect('/ws/unknown') as ws:
                ws.send_json(frame)
                with self.assertRaises(WebSocketDisconnect) as closed:
                    ws.receive_json()
                self.assertEqual(closed.exception.code, 1008)

    def test_restart_reconciles_unfinished_record(self):
        from db.base import AsyncSessionLocal
        from db.models import Run
        import uuid
        run = self.client.post('/chat', json={'prompt': 'A counter'}, headers=self.headers).json()
        self.client.post('/runs/'+run['run_id']+'/cancel', headers=self.headers)
        orphan_id = str(uuid.uuid4())
        async def insert_orphan():
            async with AsyncSessionLocal.begin() as db:
                db.add(Run(id=orphan_id, chat_id=run['chat_id'], prompt='Interrupted request', status='running'))
            await self.service.startup()
        self.client.portal.call(insert_orphan)
        runs = self.client.get(f"/chats/{run['chat_id']}/runs", headers=self.headers).json()['runs']
        orphan = next(row for row in runs if row['id'] == orphan_id)
        self.assertEqual(orphan['status'], 'interrupted')
        self.assertTrue(orphan['created_at'])
