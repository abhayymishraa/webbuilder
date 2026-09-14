"""Shared browser checks and bounded observations; screenshots stay in memory."""
import base64
from contextlib import suppress
import json
import os
from pathlib import Path
import shlex
from uuid import uuid4

MAX_SCREENSHOT_BYTES = 200_000


async def check_browser(workspace, *, preflight=False, viewport=None, path='/', screenshot_path=None) -> dict:
    script = Path(__file__).with_name('browser-check.cjs').read_text()
    command = 'PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node -e ' + shlex.quote(script)
    if preflight:
        command += ' -- --preflight'
    elif viewport is not None:
        command += ' -- --inspect ' + shlex.quote(viewport) + ' ' + shlex.quote(path)
        if screenshot_path is not None:
            command += ' ' + shlex.quote(screenshot_path)
    return await workspace.command(command, timeout=45)


async def ensure_preview_current(workspace) -> None:
    from .preview import control_preview
    if workspace.preview_revision != workspace.revision:
        # Advance only after restart succeeds; failed restarts must remain retryable.
        await control_preview(workspace.sandbox, 'restart')
        workspace.preview_revision = workspace.revision


async def inspect_preview(workspace, *, viewport, path, screenshot=False) -> dict:
    if (not path.startswith('/') or path.startswith('//') or '\\' in path
            or any(ord(char) < 32 for char in path) or len(path) > 512):
        raise ValueError('Use a local preview path such as / or /settings')
    if viewport not in {'desktop', 'mobile'}:
        raise ValueError('Use the desktop or mobile viewport')
    if screenshot:
        if os.getenv('PREVIEW_SCREENSHOTS_ENABLED', 'true').lower() != 'true':
            raise ValueError('Screenshot observations are disabled for this model deployment')
        if workspace.screenshot_attempts >= 2:
            raise ValueError('Screenshot limit reached; use text inspection for the rest of this run')
        workspace.screenshot_attempts += 1
    await ensure_preview_current(workspace)
    screenshot_path = f'/tmp/webbuilder-preview-{uuid4().hex}.jpg' if screenshot else None
    try:
        result = await check_browser(workspace, viewport=viewport, path=path, screenshot_path=screenshot_path)
        observation = parse_observation(result, workspace.revision)
        if screenshot and observation.get('checked'):
            observation['screenshot'] = {'captured': False}
            try:
                image = await read_screenshot(workspace.sandbox, screenshot_path)
            except Exception:
                observation['screenshot']['error'] = 'Screenshot unavailable; use the text observation'
            else:
                observation['screenshot'].update(captured=True, bytes=len(image), detail='low')
                # Runner removes this private field before JSON/public events or persistence.
                observation['_image'] = {'type': 'image_url', 'image_url': {
                    'url': 'data:image/jpeg;base64,' + base64.b64encode(image).decode('ascii'),
                    'detail': 'low'}}
        return observation
    finally:
        if screenshot_path:
            with suppress(Exception):
                await workspace.sandbox.files.remove(screenshot_path, request_timeout=5)


async def read_screenshot(sandbox, path) -> bytes:
    data = bytearray()
    reader = await sandbox.files.read(path, format='stream', request_timeout=10, stream_idle_timeout=5)
    async with reader:
        async for chunk in reader:
            if len(data) + len(chunk) > MAX_SCREENSHOT_BYTES:
                raise ValueError('Screenshot exceeds the size limit')
            data.extend(chunk)
    if not data.startswith(b'\xff\xd8') or not data.endswith(b'\xff\xd9'):
        raise ValueError('Screenshot is not a JPEG')
    return bytes(data)


def parse_observation(result, revision) -> dict:
    try:
        observation = json.loads(result['stdout'])
    except (ValueError, KeyError):
        return {'ok': False, 'checked': False, 'revision': revision,
                'error': 'Browser inspection did not return an observation',
                'stderr': result.get('stderr', '')[:2000]}
    if not isinstance(observation, dict) or not isinstance(observation.get('pages'), list):
        return {'ok': False, 'checked': False, 'revision': revision,
                'error': 'Browser inspection returned an invalid observation'}
    return {**observation, 'ok': bool(result['ok'] and observation.get('ok')),
            'revision': revision, 'final_verification': False}
