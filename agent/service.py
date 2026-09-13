"""Single-worker run ownership, durable outcomes and reconnectable activity."""
import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from e2b import AsyncSandbox, SandboxException
from fastapi import HTTPException
from sqlalchemy import select, update, func

from db.base import AsyncSessionLocal
from db.models import Chat, Message, Run, RunEvent, User
from .runner import run_editor, RunLimitError, VerificationError, SandboxSetupError
from .tools import ROOT
from .persistence import archive_slots, ensure_revision, latest_revision, revision_bytes, sandbox_archive, save_revision
from .storage import StorageError
from .events import redact, run_events
from .context import ContextError, ProjectContext

logger = logging.getLogger('webbuilder.runs')
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.propagate = False


@dataclass
class LiveRun:
    id: str
    chat_id: str
    prompt: str
    events: list = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    task: asyncio.Task | None = None
    sandbox: AsyncSandbox | None = None
    cancelling: bool = False
    revision_id: str | None = None
    user_id: int | None = None
    message_id: str | None = None


class Service:
    def __init__(self):
        self.active: dict[str, LiveRun] = {}
        self.sandboxes: dict[str, AsyncSandbox] = {}
        self.subscribers: dict[str, set[asyncio.Queue]] = {}
        self.admission = asyncio.Lock()
        self.stopping = False
        self.maintenance_task = None
        self.opening: set[str] = set()

    async def startup(self):
        if self.maintenance_task and not self.maintenance_task.done():
            self.maintenance_task.cancel()
            await asyncio.gather(self.maintenance_task, return_exceptions=True)
        self.stopping = False
        # No automatic replay of mutations after a process restart.
        async with AsyncSessionLocal.begin() as db:
            await db.execute(update(Run).where(Run.status == 'running').values(
                status='interrupted', reason='Server restarted before this run finished. Submit a new request to continue.',
                finished_at=datetime.now(timezone.utc)))
            await db.execute(update(Chat).values(app_url=None))
        from .maintenance import maintain_loop
        self.maintenance_task = asyncio.create_task(maintain_loop(self), name='persistence-maintenance')

    async def shutdown(self):
        self.stopping = True
        if self.maintenance_task:
            self.maintenance_task.cancel()
            await asyncio.gather(self.maintenance_task, return_exceptions=True)
        tasks = [r.task for r in self.active.values() if r.task]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    async def admit(self, user_id: int, prompt: str, chat_id: str | None = None):
        prompt = prompt.strip()
        if not prompt or len(prompt) > 12000:
            raise HTTPException(422, 'Describe a change in 1–12000 characters')
        async with self.admission:
            if self.stopping or len(self.active) + len(self.opening) >= int(os.getenv('MAX_CONCURRENT_RUNS', '2')):
                raise HTTPException(429, 'The builder is busy. Try again shortly; no credit was used.')
            async with AsyncSessionLocal.begin() as db:
                user = await db.scalar(select(User).where(User.id == user_id).with_for_update())
                if not user:
                    raise HTTPException(401, 'User not found')
                if not user.email_verified:
                    raise HTTPException(403, 'Verify your email before continuing.')
                required = ('STORAGE_BUCKET',) + (('MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY')
                    if os.getenv('STORAGE_PROVIDER', 'minio') == 'minio' else ())
                if any(not os.getenv(name) for name in required):
                    raise HTTPException(503, 'Project storage is not configured; no credit was used.')
                if chat_id:
                    chat = await db.scalar(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id).with_for_update())
                    if not chat:
                        raise HTTPException(404, 'Project not found')
                    if chat_id in self.opening or any(r.chat_id == chat_id for r in self.active.values()):
                        raise HTTPException(409, 'This project already has a running request; no credit was used.')
                else:
                    chat_id = str(uuid.uuid4())
                    db.add(Chat(id=chat_id, user_id=user_id, title=prompt[:100]))
                    await db.flush()
                if not user.use_token():
                    raise HTTPException(403, 'No credits remaining. Try after your daily reset.')
                run_id = str(uuid.uuid4())
                db.add(Run(id=run_id, chat_id=chat_id, prompt=prompt, status='running'))
                message_id = str(uuid.uuid4())
                db.add(Message(id=message_id, chat_id=chat_id, role='user', content=prompt))
                credits = user.tokens_remaining
            live = LiveRun(run_id, chat_id, prompt, user_id=user_id, message_id=message_id)
            self.active[run_id] = live
            live.task = asyncio.create_task(self.execute(live), name=f'run:{run_id}')
            return {'chat_id': chat_id, 'run_id': run_id, 'status': 'running', 'tokens_remaining': credits}

    def publish(self, chat_id, event):
        for queue in list(self.subscribers.get(chat_id, set())):
            if queue.full():
                # A slow observer reloads a snapshot rather than blocking generation.
                while not queue.empty():
                    queue.get_nowait()
                queue.put_nowait({'e': 'resync'})
            else:
                queue.put_nowait(event)

    def event(self, live, kind, **payload):
        return redact({'e': kind, 'run_id': live.id, 'event_id': f'{live.id}:{len(live.events) + 1}',
                 'sequence': len(live.events) + 1, 'created_at': datetime.now(timezone.utc).isoformat(), **payload}
        )

    async def emit(self, live, kind, **payload):
        if len(live.events) >= 200:
            raise RunLimitError('Activity budget reached')
        event = self.event(live, kind, **payload)
        async with AsyncSessionLocal.begin() as db:
            db.add(RunEvent(run_id=live.id, sequence=event['sequence'], payload=event))
        live.events.append(event)
        self.publish(live.chat_id, event)
        record = {k: event[k] for k in ('e', 'run_id', 'sequence')}
        if kind == 'stage':
            live.metrics['stage'] = payload.get('message')
            record['stage'] = payload.get('message')
        elif kind in ('verification', 'tool_completed'):
            record['ok'] = payload.get('ok')
        logger.info(json.dumps(record))

    async def checkpoint(self, live, dirty=False):
        if dirty:
            await self.save_files(live)
        async with AsyncSessionLocal.begin() as db:
            await db.execute(update(Run).where(Run.id == live.id).values(metrics=redact(live.metrics)))

    async def get_e2b_sandbox(self, id: str):
        sandbox = self.sandboxes.get(id)
        if sandbox:
            try:
                await sandbox.set_timeout(1200)
                return sandbox
            except Exception:
                self.sandboxes.pop(id, None)
        revision = await ensure_revision(id)
        sandbox = await AsyncSandbox.create(template=revision.template_id if revision else os.environ['E2B_TEMPLATE_ID'], timeout=1200)
        self.sandboxes[id] = sandbox
        try:
            await sandbox.commands.run('python3 -c "import hashlib, zipfile; assert hasattr(hashlib, \'file_digest\')"', timeout=10)
        except Exception:
            raise SandboxSetupError('Sandbox archive tools are unavailable. Rebuild sandbox/Dockerfile with Python 3.11 or later. No model request was made.') from None
        if revision:
            async with archive_slots:
                await sandbox_archive(sandbox, 'restore', await revision_bytes(revision))
            if 'package-lock.json' not in revision.manifest:
                raise StorageError('Saved project needs package-lock.json before preview can be restored')
            await sandbox.commands.run('npm ci --ignore-scripts --no-audit --no-fund', cwd=ROOT, timeout=90)
        return sandbox

    async def save_files(self, live):
        if not live.sandbox:
            return
        if len(live.events) >= 200:
            raise RunLimitError('Activity budget reached before checkpoint')
        current = await latest_revision(live.chat_id)
        async with archive_slots:
            archive = await sandbox_archive(live.sandbox, 'pack')
            live.revision_id, event = await save_revision(live.chat_id, live.id, archive,
                current.template_id if current else os.environ['E2B_TEMPLATE_ID'],
                lambda revision_id: self.event(live, 'checkpoint_saved', revision_id=revision_id,
                                               message='Project files saved'))
        if event:
            live.events.append(event)
            self.publish(live.chat_id, event)

    async def open_preview(self, chat_id):
        async with self.admission:
            if (self.stopping or chat_id in self.opening or any(r.chat_id == chat_id for r in self.active.values())
                    or len(self.active) + len(self.opening) >= int(os.getenv('MAX_CONCURRENT_RUNS', '2'))):
                raise HTTPException(409, 'Wait for the current operation to finish')
            self.opening.add(chat_id)
        try:
            if not await ensure_revision(chat_id):
                raise HTTPException(404, 'No saved project yet')
            async with asyncio.timeout(180):
                sandbox = await self.get_e2b_sandbox(chat_id)
                # The template owns the dev server. Confirm it responds, never start another server.
                await sandbox.commands.run('curl --fail --silent --retry 5 --retry-connrefused '
                    '--retry-delay 2 --max-time 5 http://localhost:5173/ >/dev/null', cwd=ROOT, timeout=45)
                url = 'https://' + sandbox.get_host(5173)
                async with AsyncSessionLocal.begin() as db:
                    await db.execute(update(Chat).where(Chat.id == chat_id).values(app_url=url))
                return {'url': url}
        except BaseException:
            sandbox = self.sandboxes.pop(chat_id, None)
            if sandbox:
                try:
                    await asyncio.wait_for(sandbox.kill(), timeout=10)
                except Exception:
                    pass
            raise
        finally:
            self.opening.discard(chat_id)

    async def finish(self, live, status, reason, result=None):
        event = self.event(live, 'run_finished', **{'event_id': f'{live.id}:terminal',
                 'status': status, 'message': reason, 'metrics': live.metrics,
                 'url': result['url'] if result and status == 'succeeded' else None,
                 'revision_id': live.revision_id})
        async with AsyncSessionLocal.begin() as db:
            run = await db.get(Run, live.id, with_for_update=True)
            if not run or run.status != 'running':
                return
            # A cancelled DB await may have committed an event before updating LiveRun.
            # Allocate terminal sequence from durable state rather than the in-memory length.
            last_sequence = await db.scalar(select(func.coalesce(func.max(RunEvent.sequence), 0))
                                           .where(RunEvent.run_id == live.id))
            event['sequence'] = last_sequence + 1
            await db.execute(update(Run).where(Run.id == live.id).values(status=status, reason=reason,
                metrics=redact(live.metrics), finished_at=datetime.now(timezone.utc)))
            changes = {'app_url': event['url']}
            if status == 'succeeded' and live.revision_id:
                changes['latest_verified_revision_id'] = live.revision_id
            await db.execute(update(Chat).where(Chat.id == live.chat_id).values(**changes))
            db.add(RunEvent(run_id=live.id, sequence=event['sequence'], payload=event))
            db.add(Message(id=live.id, chat_id=live.chat_id, role='assistant', content=reason, event_type='run_summary'))
        live.events.append(event)
        self.publish(live.chat_id, event)
        logger.info(json.dumps({'run_id': live.id, 'status': status, **{
            key: live.metrics.get(key) for key in ('turns', 'tool_calls', 'total_tokens', 'elapsed_ms', 'error_type', 'stage', 'sandbox_cleanup')}}))

    async def execute(self, live):
        started = time.monotonic()
        status, reason, result = 'failed', 'The run failed. Submit a new request to retry.', None
        try:
            async with asyncio.timeout(int(os.getenv('RUN_TIMEOUT_SECONDS', '600'))):
                await self.emit(live, 'run_started', message='Starting your request')
                live.sandbox = await self.get_e2b_sandbox(live.chat_id)
                result = await run_editor(live.sandbox, live.prompt,
                    lambda kind, **data: self.emit(live, kind, **data),
                    lambda dirty=False: self.checkpoint(live, dirty), live.metrics,
                    memory=ProjectContext(live.chat_id, live.user_id, live.message_id)
                    if live.user_id is not None and live.message_id is not None else None)
                await self.save_files(live)
                status, reason = 'succeeded', result['summary'] + '\n\nProduction build and desktop/mobile browser smoke checks passed.'
        except TimeoutError:
            status, reason = 'timed_out', 'The run reached its time limit. Partial changes may remain; submit a smaller request.'
        except asyncio.CancelledError:
            status = 'interrupted' if self.stopping else 'cancelled'
            reason = 'Server stopped; submit a new request to continue.' if self.stopping else 'Stopped at your request. The last acknowledged checkpoint remains available.'
        except (RunLimitError, VerificationError, ContextError) as exc:
            reason = str(exc)
            live.metrics['error_type'] = type(exc).__name__
        except StorageError as exc:
            reason = str(exc) + '. The last acknowledged checkpoint is safe. No automatic AI retry was started.'
            live.metrics['error_type'] = 'StorageError'
        except SandboxException as exc:
            reason = 'The build sandbox could not complete an operation. Retry the request; if it keeps failing, check the E2B template and service availability.'
            live.metrics['error_type'] = type(exc).__name__
            logger.error('Sandbox operation failed run_id=%s error_type=%s stage=%s',
                         live.id, type(exc).__name__, live.metrics.get('stage'))
        except Exception as exc:
            # Exception text can include provider requests or secrets. Log safe identity only.
            live.metrics['error_type'] = type(exc).__name__
            logger.error('Run failed run_id=%s error_type=%s', live.id, type(exc).__name__)
        finally:
            # Creation registers ownership before restoring files; cancellation can interrupt restoration.
            live.sandbox = live.sandbox or self.sandboxes.get(live.chat_id)
            live.metrics['elapsed_ms'] = round((time.monotonic() - started) * 1000)
            if status != 'succeeded' and live.sandbox:
                # Completed mutation batches are already saved. Never archive a half-finished command.
                try:
                    await asyncio.wait_for(live.sandbox.kill(), timeout=10)
                    live.metrics['sandbox_cleanup'] = 'killed'
                except Exception:
                    live.metrics['sandbox_cleanup'] = 'ttl_fallback'
                    reason += ' Sandbox cleanup could not be confirmed; its 20-minute expiry still applies.'
                    logger.warning('Sandbox kill failed; sandbox TTL remains bounded run_id=%s', live.id)
                self.sandboxes.pop(live.chat_id, None)
            try:
                await self.finish(live, status, reason, result)
            except Exception:
                logger.error('Could not persist terminal state run_id=%s', live.id)
                self.publish(live.chat_id, {'e': 'resync'})
            self.active.pop(live.id, None)

    async def cancel(self, run_id):
        live = self.active.get(run_id)
        if live and live.task and not live.cancelling:
            live.cancelling = True
            live.task.cancel()
            await asyncio.gather(live.task, return_exceptions=True)
            # Cancellation before the coroutine's first instruction still gets a terminal record.
            if run_id in self.active:
                await self.finish(live, 'cancelled', 'Stopped before generation started.')
                self.active.pop(run_id, None)

    async def snapshot(self, chat_id, offset=0, limit=10):
        async with AsyncSessionLocal.begin() as db:
            rows = (await db.scalars(select(Run).where(Run.chat_id == chat_id).order_by(Run.created_at.desc(), Run.id.desc())
                                    .offset(offset).limit(limit))).all()
            runs = []
            for row in reversed(rows):
                live = self.active.get(row.id)
                if row.status == 'running' and not live:
                    row.status, row.reason = 'interrupted', 'Run stopped before a final state was saved. Submit a new request to continue.'
                    row.finished_at = datetime.now(timezone.utc)
                runs.append({'id': row.id, 'status': row.status, 'reason': row.reason, 'created_at': row.created_at.isoformat(),
                    'events': await run_events(db, row.id), 'metrics': redact(live.metrics) if live else row.metrics})
            return runs


agent_service = Service()
