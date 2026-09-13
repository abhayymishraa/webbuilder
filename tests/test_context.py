"""No provider calls. PostgreSQL tests require an explicitly isolated database."""
import asyncio
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch
import uuid

from langchain_core.messages import AIMessage
from sqlalchemy import delete, select

from agent.context import (ContextError, ProjectContext, assemble, choose_files,
                           encoded_size, validate_summary)

FIXTURES = json.loads((Path(__file__).parent / 'fixtures/context_conversations.json').read_text())


def source(i, content, role='user'):
    return {'id': str(i), 'content': content, 'role': role, 'kind': 'message',
            'created_at': f'2026-09-13T00:00:{i:02d}+00:00', 'truncated': False}


class ContextUnitTests(unittest.TestCase):
    def test_reversals_keep_chronological_evidence_instead_of_asserting_old_rule(self):
        fixture = next(f for f in FIXTURES if f['name'] == 'reversed_palette')
        rows = [source(i, s) for i, s in enumerate(fixture['history'])]
        result = assemble(rows, rows, rows[0], None, 'current', None, 'next')
        self.assertEqual(result['recent_messages'][-1]['content'], fixture['latest_decision'])
        self.assertEqual(result['older_matches'], [])
        self.assertTrue(result['history_is_partial'])

    def test_named_and_renamed_files_only_resolve_current_paths(self):
        for fixture in FIXTURES:
            if 'paths' in fixture:
                with self.subTest(fixture=fixture['name']):
                    result = choose_files(fixture['paths'], fixture['request'], fixture['history'])
                    self.assertIn(fixture['expected_file'], result)
                    self.assertTrue(set(result) <= set(fixture['paths']))

    def test_summary_rejects_invented_quotes_assistant_requirements_and_missing_sources(self):
        rows = {'0': source(0, 'Use blue'), '1': source(1, 'Use orange', 'assistant')}
        for evidence in ({'message_id': '0', 'quote': 'Use red'},
                         {'message_id': '1', 'quote': 'Use orange'},
                         {'message_id': 'missing', 'quote': 'Use blue'}):
            with self.subTest(evidence=evidence), self.assertRaises(ContextError):
                validate_summary({'overview': '', 'unresolved': '', 'user_decisions': [evidence]}, rows)
        valid = {'overview': 'Historical request', 'unresolved': '',
                 'user_decisions': [{'message_id': '0', 'quote': 'Use blue'}]}
        self.assertEqual(validate_summary(valid, rows), valid)

    def test_oversized_recent_context_stops_instead_of_silently_losing_requirements(self):
        rows = [source(i, 'x' * 12000) for i in range(6)]
        with self.assertRaises(ContextError):
            assemble(rows, [], None, None, None, None, 'now')

    def test_attempted_work_remains_failed(self):
        fixture = next(f for f in FIXTURES if f['name'] == 'failed_work')
        result = assemble([], [], None, None, None, fixture['previous_run'], 'now')
        self.assertEqual(result['previous_run']['status'], 'failed')


class CompactionFailureTests(unittest.IsolatedAsyncioTestCase):
    async def test_runner_receives_history_but_activity_does_not_copy_private_messages(self):
        from langchain_core.tools import tool
        from agent.runner import run_editor
        from test_orchestration import FakeSandbox, Model, reply
        @tool
        async def search_project_history(query: str) -> dict:
            """Find prior project messages."""
            return {'ok': True, 'messages': [{'id': 'past', 'content': 'Private historical instruction'}]}
        class CapturingModel(Model):
            async def ainvoke(self, messages):
                self.captured = list(messages)
                return await super().ainvoke(messages)
        model = CapturingModel([reply([{'name': 'search_project_history', 'id': 'history-call',
            'args': {'query': 'palette'}, 'type': 'tool_call'}]), reply()])
        memory = SimpleNamespace(tool=lambda: search_project_history,
            build=AsyncMock(return_value={'initial_request': 'Keep orange'}))
        events = AsyncMock()
        with patch('agent.runner.verify', new=AsyncMock(return_value={'ok': True})):
            await run_editor(FakeSandbox(), 'Add profile', events, AsyncMock(), {}, model, memory)
        self.assertIn('Keep orange', model.captured[1].content)
        self.assertIn('Private historical instruction', model.captured[-1].content)
        completion = next(c for c in events.call_args_list if c.args[0] == 'tool_completed')
        self.assertIn('past', completion.kwargs['output'])
        self.assertNotIn('Private historical instruction', completion.kwargs['output'])

    async def test_failure_keeps_previous_summary_and_reserves_spend(self):
        memory = ProjectContext('chat', 1, 'message')
        previous = {'overview': 'Old summary', 'user_decisions': [], 'unresolved': ''}
        row = SimpleNamespace(id='one', role='user', content='Use orange', truncated=False,
                              event_type=None, created_at=datetime.now(timezone.utc))
        model = SimpleNamespace(model_copy=lambda **kw: SimpleNamespace(ainvoke=AsyncMock(side_effect=RuntimeError('offline'))))
        metrics = {}
        result = await memory.compact([row], previous, 1, None, model, metrics, 200000)
        self.assertEqual(result, previous)
        self.assertEqual(metrics['compaction'], 'failed_previous_retained')
        self.assertGreater(metrics['reserved_tokens'], 0)

    async def test_budget_skips_provider_call(self):
        row = SimpleNamespace(id='one', role='user', content='Use orange', truncated=False,
                              event_type=None, created_at=datetime.now(timezone.utc))
        result = await ProjectContext('chat', 1, 'message').compact([row], None, None, None,
            object(), {}, 1)
        self.assertIsNone(result)

    async def test_cancellation_is_not_swallowed(self):
        row = SimpleNamespace(id='one', role='user', content='Use orange', truncated=False,
                              event_type=None, created_at=datetime.now(timezone.utc))
        model = SimpleNamespace(model_copy=lambda **kw: SimpleNamespace(ainvoke=AsyncMock(side_effect=asyncio.CancelledError)))
        with self.assertRaises(asyncio.CancelledError):
            await ProjectContext('chat', 1, 'message').compact([row], None, None, None, model, {}, 200000)


@unittest.skipUnless(os.getenv('RUN_CONTEXT_DB_TESTS') == '1', 'Opt-in isolated PostgreSQL context tests')
class ContextDatabaseTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from db.base import AsyncSessionLocal, Base, engine
        from db.models import User
        if engine.url.host not in ('localhost', '127.0.0.1') or 'webbuilder_test' not in (engine.url.database or ''):
            raise RuntimeError('Context fixtures require a local webbuilder_test database')
        self.db, self.engine = AsyncSessionLocal, engine
        await engine.dispose()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with self.db.begin() as db:
            user = User(email=f'{uuid.uuid4()}@example.org', name='Context fixture',
                        hashed_password='unused', email_verified=True)
            db.add(user); await db.flush(); self.user_id = user.id

    async def asyncTearDown(self):
        from db.models import User
        async with self.db.begin() as db:
            await db.execute(delete(User).where(User.id == self.user_id))
        await self.engine.dispose()

    async def project(self, history, request, previous_run=None):
        from db.models import Chat, Message, Run
        chat_id = str(uuid.uuid4())
        start = datetime.now(timezone.utc) - timedelta(hours=1)
        ids = []
        async with self.db.begin() as db:
            db.add(Chat(id=chat_id, user_id=self.user_id, title='Context fixture')); await db.flush()
            for i, content in enumerate(history + [request]):
                mid = str(uuid.uuid4()); ids.append(mid)
                db.add(Message(id=mid, chat_id=chat_id, role='user', content=content,
                               created_at=start + timedelta(seconds=i)))
            if previous_run:
                db.add(Run(id=str(uuid.uuid4()), chat_id=chat_id, prompt='Previous request',
                    status=previous_run['status'], reason=previous_run['reason'], created_at=start))
        return ProjectContext(chat_id, self.user_id, ids[-1]), ids

    async def test_fixture_pack_through_real_postgres_context_builder(self):
        from db.models import Chat
        for fixture in FIXTURES:
            with self.subTest(fixture=fixture['name']):
                ctx, ids = await self.project(fixture['history'], fixture['request'], fixture.get('previous_run'))
                if fixture.get('foreign_history'):
                    await self.project(fixture['foreign_history'], 'Unrelated')
                with patch.dict(os.environ, {'MEMORY_COMPACTION_ENABLED': 'false'}):
                    result = await ctx.build(fixture['request'], object(), {}, 100000)
                    restored = await ProjectContext(ctx.chat_id, self.user_id, ids[-1]).build(
                        fixture['request'], object(), {}, 100000)
                self.assertEqual(result, restored)
                evidence = result['recent_messages'] + result['older_matches'] + [result['initial_request']]
                found = {r['id'] for r in evidence if r}
                self.assertTrue({ids[i] for i in fixture['must_retrieve']} <= found)
                self.assertNotIn(ids[-1], found)
                self.assertLessEqual(encoded_size(result), 48000)
                if fixture.get('must_exclude'):
                    self.assertNotIn(fixture['must_exclude'], json.dumps(result))
                wrong_owner = ProjectContext(ctx.chat_id, self.user_id + 1000000, ids[-1])
                with self.assertRaises(ContextError):
                    await wrong_owner.search('orange')
                if fixture['name'] == 'deletion':
                    async with self.db.begin() as db:
                        await db.execute(delete(Chat).where(Chat.id == ctx.chat_id))
                    with self.assertRaises(ContextError):
                        await ctx.search('preferences')

    async def test_compaction_publishes_cutoff_and_rejects_stale_writer(self):
        from db.models import ProjectMemory, Message, Chat
        history = ['Keep verification mandatory.'] + [f'Add section {i}.' for i in range(20)]
        ctx, ids = await self.project(history, 'Continue')
        value = {'overview': 'Sections requested, not verified.', 'unresolved': 'Build not checked.',
                 'user_decisions': [{'message_id': ids[0], 'quote': history[0]}]}
        fake = SimpleNamespace(model_copy=lambda **kw: SimpleNamespace(ainvoke=AsyncMock(return_value=
            AIMessage(content=json.dumps(value), usage_metadata={'input_tokens': 20, 'output_tokens': 10, 'total_tokens': 30}))))
        with patch.dict(os.environ, {'MEMORY_COMPACTION_ENABLED': 'true'}):
            result = await ctx.build('Continue', fake, {}, 200000)
        self.assertIsNotNone(result['older_summary'])
        async with self.db() as db:
            saved = await db.get(ProjectMemory, ctx.chat_id)
            self.assertEqual(saved.covered_message_id, ids[-8])
            current = await db.get(Message, ids[-1])
            pending = (await db.execute(ctx.history(current).order_by(Message.created_at, Message.id).limit(1))).all()
        stale = await ctx.compact(pending, None, None, None, fake, {}, 200000)
        self.assertIsNone(stale)
        async with self.db.begin() as db:
            self.assertEqual((await db.get(ProjectMemory, ctx.chat_id)).version, saved.version)
            await db.execute(delete(Chat).where(Chat.id == ctx.chat_id))
        async with self.db() as db:
            self.assertIsNone(await db.get(ProjectMemory, ctx.chat_id))

    async def test_middle_history_retrieval_cutoff_and_verification_revocation(self):
        from db.models import Message, User
        from sqlalchemy import update
        history = ['Build a portfolio.', 'Keep verified email mandatory before chatting.']
        history += [f'Adjust heading number {i}.' for i in range(12)]
        ctx, ids = await self.project(history, 'Change verified email access.')
        matches = await ctx.search('verified email')
        self.assertIn(ids[1], {r['id'] for r in matches['messages']})
        # A later message cannot alter the evidence cutoff of this admitted request.
        async with self.db.begin() as db:
            db.add(Message(id=str(uuid.uuid4()), chat_id=ctx.chat_id, role='user',
                content='Later verified email instruction', created_at=datetime.now(timezone.utc)))
        self.assertEqual(matches, await ctx.search('verified email'))
        async with self.db.begin() as db:
            await db.execute(update(User).where(User.id == self.user_id).values(email_verified=False))
        with self.assertRaises(ContextError):
            await ctx.search('verified email')
