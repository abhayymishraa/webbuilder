"""Typed, source-preserving tools. Sandbox code never receives API credentials."""
import json
import re
from pathlib import PurePosixPath
from typing import Annotated

from langchain_core.tools import tool
from pydantic import BaseModel, Field

ROOT = '/home/user/react-app'
MAX_FILE_BYTES = 200_000
MAX_OUTPUT = 12_000


def project_path(path: str) -> str:
    p = PurePosixPath(path)
    if not path or p.is_absolute() or '..' in p.parts or '\\' in path:
        raise ValueError('Use a relative project path without traversal')
    if any(part in {'.git', '.env', 'node_modules', '.venv'} for part in p.parts):
        raise ValueError('That path is outside editable project files')
    if any(part.startswith('.env.') for part in p.parts):
        raise ValueError('Environment files are not editable')
    return str(p)


class FileChange(BaseModel):
    path: str
    content: str = Field(max_length=MAX_FILE_BYTES)


class WorkspaceTools:
    def __init__(self, sandbox):
        self.sandbox = sandbox
        self.cache: dict[str, str] = {}
        self.revision = 0

    async def read(self, path: str) -> str:
        path = project_path(path)
        if path not in self.cache:
            content = await self.sandbox.files.read(f'{ROOT}/{path}')
            if len(content.encode()) > MAX_FILE_BYTES:
                raise ValueError('File exceeds the source-size limit')
            self.cache[path] = content
        return self.cache[path]

    async def command(self, command: str, timeout: int = 60) -> dict:
        try:
            result = await self.sandbox.commands.run(command, cwd=ROOT, timeout=timeout)
            return {'ok': result.exit_code == 0, 'exit_code': result.exit_code,
                    'stdout': result.stdout[-MAX_OUTPUT:], 'stderr': result.stderr[-MAX_OUTPUT:]}
        except Exception as exc:
            # E2B raises on non-zero exit; retain its diagnostic, never mark it green.
            return {'ok': False, 'error_type': type(exc).__name__, 'exit_code': getattr(exc, 'exit_code', None),
                    'stdout': str(getattr(exc, 'stdout', ''))[-MAX_OUTPUT:],
                    'stderr': str(getattr(exc, 'stderr', '') or str(exc))[-MAX_OUTPUT:]}

    def definitions(self):
        @tool
        async def read_files(paths: Annotated[list[str], Field(min_length=1, max_length=12)]) -> dict:
            """Read relevant project files together. Unchanged files are cached; avoid repeat reads."""
            result = {}
            for path in paths:
                result[path] = await self.read(path)
            return {'ok': True, 'files': result}

        @tool
        async def write_files(files: Annotated[list[FileChange], Field(min_length=1, max_length=12)]) -> dict:
            """Create or replace source files. Pass typed objects; content is written exactly as supplied."""
            paths = [project_path(f.path) for f in files]
            if len(set(paths)) != len(paths):
                raise ValueError('A batch must not write the same path twice')
            if sum(len(f.content.encode()) for f in files) > 500_000:
                raise ValueError('Batch is too large')
            # Sequential writes avoid conflicting mutation races. Partial writes are reported as failures.
            for path, item in zip(paths, files):
                await self.sandbox.files.write(f'{ROOT}/{path}', item.content)
                self.cache[path] = item.content
                self.revision += 1
            return {'ok': True, 'changed_files': paths}

        @tool
        async def execute_command(command: str) -> dict:
            """Run a bounded shell command in the project for concrete diagnostics or requested skill discovery. The dev server is already running: never start it again. Do not install relative paths as packages."""
            if len(command) > 2000:
                raise ValueError('Command is too long')
            if re.search(r'npm\s+(?:i|install)\s+(?:\.{1,2})(?:\s|$)', command):
                raise ValueError('Relative imports are not npm packages')
            if re.search(r'npm\s+run\s+(?:dev|start)\b', command):
                raise ValueError('The template already runs the dev server')
            result = await self.command(command)
            self.cache.clear()
            # Shell can modify files; invalidate cached reads even on failed commands.
            self.revision += 1
            return result

        return [read_files, write_files, execute_command]


LIST_FILES_JS = r"""
const fs=require('fs'),path=require('path');const out=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 if(['node_modules','.git','dist','.next','.env'].includes(e.name)||e.name.startsWith('.env.'))continue;
 const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile())out.push(p);
 if(out.length>250)throw Error('Project file limit exceeded');
}}walk('.');console.log(JSON.stringify(out));
"""


async def list_files(sandbox) -> list[str]:
    import shlex
    result = await sandbox.commands.run('node -e ' + shlex.quote(LIST_FILES_JS), cwd=ROOT, timeout=20)
    return [project_path(p) for p in json.loads(result.stdout)]
