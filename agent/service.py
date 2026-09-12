"""Single-worker run ownership, durable outcomes and reconnectable activity."""
import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from e2b import AsyncSandbox, SandboxException
from fastapi import HTTPException
from sqlalchemy import select, update

from db.base import AsyncSessionLocal
from db.models import Chat, Message, Run, User
from .runner import run_editor, RunLimitError, VerificationError
from .tools import list_files, project_path, ROOT, MAX_FILE_BYTES

logger = logging.getLogger('webbuilder.runs')
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.propagate = False
PROJECTS = Path(__file__).resolve().parent.parent / 'projects'


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


class Service:
    def __init__(self):
        self.active: dict[str, LiveRun] = {}
        self.sandboxes: dict[str, AsyncSandbox] = {}
        self.subscribers: dict[str, set[asyncio.Queue]] = {}
        self.admission = asyncio.Lock()
        self.stopping = False

    async def startup(self):
        self.stopping = False
        # No automatic replay of mutations after a process restart.
        async with AsyncSessionLocal.begin() as db:
            await db.execute(update(Run).where(Run.status == 'running').values(
                status='interrupted', reason='Server restarted before this run finished. Submit a new request to continue.',
                finished_at=datetime.now(timezone.utc)))

    async def shutdown(self):
        self.stopping = True
        tasks = [r.task for r in self.active.values() if r.task]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    async def admit(self, user_id: int, prompt: str, chat_id: str | None = None):
        prompt = prompt.strip()
        if not prompt or len(prompt) > 12000:
            raise HTTPException(422, 'Describe a change in 1–12000 characters')
        async with self.admission:
            if self.stopping or len(self.active) >= int(os.getenv('MAX_CONCURRENT_RUNS', '2')):
                raise HTTPException(429, 'The builder is busy. Try again shortly; no credit was used.')
            async with AsyncSessionLocal.begin() as db:
                user = await db.scalar(select(User).where(User.id == user_id).with_for_update())
                if not user:
                    raise HTTPException(401, 'User not found')
                if chat_id:
                    chat = await db.scalar(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id).with_for_update())
                    if not chat:
                        raise HTTPException(404, 'Project not found')
                    if any(r.chat_id == chat_id for r in self.active.values()):
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
            live = LiveRun(run_id, chat_id, prompt)
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

    async def emit(self, live, kind, **payload):
        event = {'e': kind, 'run_id': live.id, 'event_id': f'{live.id}:{len(live.events) + 1}',
                 'sequence': len(live.events) + 1, 'created_at': datetime.now(timezone.utc).isoformat(), **payload}
        if len(live.events) >= 200:
            raise RunLimitError('Activity budget reached')
        live.events.append(event)
        self.publish(live.chat_id, event)
        record = {k: event[k] for k in ('e', 'run_id', 'sequence')}
        if kind == 'stage':
            live.metrics['stage'] = payload.get('message')
            record['stage'] = payload.get('message')
        elif kind in ('verification', 'tool_completed'):
            record['ok'] = payload.get('ok')
        logger.info(json.dumps(record))

    async def checkpoint(self, live):
        async with AsyncSessionLocal.begin() as db:
            await db.execute(update(Run).where(Run.id == live.id).values(events=list(live.events), metrics=dict(live.metrics)))

    async def get_e2b_sandbox(self, id: str):
        sandbox = self.sandboxes.get(id)
        if sandbox:
            try:
                await sandbox.set_timeout(1200)
                return sandbox
            except Exception:
                self.sandboxes.pop(id, None)
        sandbox = await AsyncSandbox.create(template=os.environ['E2B_TEMPLATE_ID'], timeout=1200)
        self.sandboxes[id] = sandbox
        folder = PROJECTS / id
        metadata = folder / 'metadata.json'
        if metadata.exists():
            info = json.loads(metadata.read_text())
            for name in info.get('files', [])[:250]:
                name = project_path(name)
                local = folder / 'files' / name if info.get('version') == 2 else folder / name.replace('/', '_')
                if local.is_file() and local.stat().st_size <= MAX_FILE_BYTES:
                    await sandbox.files.write(f'{ROOT}/{name}', local.read_text())
            # Package manifests may have changed since the template was built.
            await sandbox.commands.run('npm install --ignore-scripts --no-audit --no-fund', cwd=ROOT, timeout=90)
        return sandbox

    async def save_files(self, live):
        if not live.sandbox:
            return
        folder = PROJECTS / live.chat_id
        names = await list_files(live.sandbox)
        saved = []
        for name in names:
            if name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2')):
                continue
            try:
                content = await live.sandbox.files.read(f'{ROOT}/{name}')
            except Exception:
                continue
            if len(content.encode()) > MAX_FILE_BYTES:
                continue
            target = folder / 'files' / project_path(name)
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_name(target.name + '.tmp')
            temporary.write_text(content)
            temporary.replace(target)
            saved.append(name)
        folder.mkdir(parents=True, exist_ok=True)
        temporary = folder / 'metadata.tmp'
        temporary.write_text(json.dumps({'version': 2, 'files': saved}))
        temporary.replace(folder / 'metadata.json')

    async def finish(self, live, status, reason, result=None):
        event = {'e': 'run_finished', 'run_id': live.id, 'event_id': f'{live.id}:terminal',
                 'status': status, 'message': reason, 'metrics': live.metrics,
                 'url': result['url'] if result and status == 'succeeded' else None,
                 'created_at': datetime.now(timezone.utc).isoformat()}
        live.events.append(event)
        async with AsyncSessionLocal.begin() as db:
            await db.execute(update(Run).where(Run.id == live.id).values(status=status, reason=reason,
                events=list(live.events), metrics=dict(live.metrics), finished_at=datetime.now(timezone.utc)))
            await db.execute(update(Chat).where(Chat.id == live.chat_id).values(app_url=event['url']))
            db.add(Message(id=live.id, chat_id=live.chat_id, role='assistant', content=reason, event_type='run_summary'))
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
                    lambda: self.checkpoint(live), live.metrics)
                await self.save_files(live)
                status, reason = 'succeeded', result['summary'] + '\n\nProduction build and desktop/mobile browser smoke checks passed.'
        except TimeoutError:
            status, reason = 'timed_out', 'The run reached its time limit. Partial changes may remain; submit a smaller request.'
        except asyncio.CancelledError:
            status = 'interrupted' if self.stopping else 'cancelled'
            reason = 'Server stopped; submit a new request to continue.' if self.stopping else 'Stopped at your request. Uncheckpointed changes were discarded.'
        except (RunLimitError, VerificationError) as exc:
            reason = str(exc)
            live.metrics['error_type'] = type(exc).__name__
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
                # Stop requests terminate external work promptly. Preserve completed edits only on ordinary failure.
                if status == 'failed':
                    try:
                        async with asyncio.timeout(15):
                            await self.save_files(live)
                    except Exception:
                        logger.warning('Partial snapshot unavailable run_id=%s', live.id)
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

    async def snapshot(self, chat_id):
        async with AsyncSessionLocal.begin() as db:
            rows = (await db.scalars(select(Run).where(Run.chat_id == chat_id).order_by(Run.created_at.desc()).limit(10))).all()
            runs = []
            for row in reversed(rows):
                live = self.active.get(row.id)
                if row.status == 'running' and not live:
                    row.status, row.reason = 'interrupted', 'Run stopped before a final state was saved. Submit a new request to continue.'
                    row.finished_at = datetime.now(timezone.utc)
                runs.append({'id': row.id, 'status': row.status, 'reason': row.reason, 'created_at': row.created_at.isoformat(),
                    'events': list(live.events) if live else row.events, 'metrics': dict(live.metrics) if live else row.metrics})
            return runs


agent_service = Service()
