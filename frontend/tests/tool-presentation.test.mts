import { test } from 'node:test';
import assert from 'node:assert/strict';
import { presentTool } from '../lib/tool-presentation.ts';

test('structured data wins over a legacy string and preserves total/truncation information', () => {
  const result = presentTool({ name: 'write_files', status: 'success', output: 'unparseable old output',
    details: { version: 1, changed_files: ['src/App.jsx'], file_count: 12, truncated_fields: ['changed_files'] } });
  assert.equal(result.summary, '12 files updated');
  assert.deepEqual(result.files, ['src/App.jsx']);
  assert.deepEqual(result.truncatedFields, ['changed_files']);
});

test('future versions use the legacy output fallback', () => {
  const result = presentTool({ name: 'read_files', status: 'success', details: { version: 99, files: ['wrong'] },
    output: JSON.stringify({ files: ['correct'] }) });
  assert.deepEqual(result.files, ['correct']);
});

test('started writes do not claim files have changed and command failures expose stderr', () => {
  const pending = presentTool({ name: 'write_files', status: 'running', details: { version: 1, paths: ['a.jsx'], file_count: 1 } });
  assert.equal(pending.summary, '1 file targeted');
  const failed = presentTool({ name: 'execute_command', status: 'error', details: { version: 1, stderr: 'Build error', exit_code: 1 } });
  assert.equal(failed.summary, 'Build error');
  assert.equal(failed.exitCode, 1);
});
