import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRunEvent, handleWebSocketMessage, restoreRuns } from '../lib/websocket-handlers.ts';
import type { Message, RunEvent, WebSocketHandlers } from '../lib/chat-types.ts';
const event = (e: string, id: string, extra = {}): RunEvent => ({ e, run_id: 'run', event_id: id, created_at: '2026-09-12T00:00:00Z', call_id: id, name: 'read_files', ...extra });

test('same-name tools complete independently and failures remain failures', () => {
  let messages: Message[] = [];
  messages = applyRunEvent(messages, event('tool_started', 'one'));
  messages = applyRunEvent(messages, event('tool_started', 'two'));
  messages = applyRunEvent(messages, event('tool_completed', 'one', { ok: false, output: 'Not found' }));
  assert.equal(messages[0].tool_calls?.[0].status, 'error');
  assert.equal(messages[0].tool_calls?.[1].status, 'running');
  messages = applyRunEvent(messages, event('tool_started', 'one'));
  assert.equal(messages[0].tool_calls?.length, 2);
  assert.equal(messages[0].tool_calls?.[0].status, 'error');
});

test('replay is idempotent and interrupted runs close incomplete operations', () => {
  const runs = [{ id: 'run', status: 'interrupted' as const, reason: 'Server restarted', events: [event('tool_started', 'one')] }];
  const once = restoreRuns([], runs);
  const twice = restoreRuns(once, runs);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].tool_calls?.length, 1);
  assert.equal(twice[0].tool_calls?.[0].status, 'error');
  assert.equal(twice[0].content, 'Server restarted');
});

test('late events after a terminal snapshot cannot resurrect the spinner', () => {
  let building = false;
  const noop = () => {};
  const handlers: WebSocketHandlers = { terminalRuns: new Set(['run']),
    setIsBuilding: value => { building = value; }, setRunId: noop, setMessages: noop,
    setAppUrl: noop, setError: noop, consolidateMessages: messages => messages };
  handleWebSocketMessage({ data: JSON.stringify(event('stage', 'late')) } as MessageEvent, handlers);
  assert.equal(building, false);
});

test('replayed completion cannot clear a newer active run', () => {
  let building = true;
  let runId: string | null = 'new-run';
  const noop = () => {};
  const handlers: WebSocketHandlers = { terminalRuns: new Set(['run']),
    setIsBuilding: value => { building = value; }, setRunId: value => { runId = value; },
    setMessages: noop, setAppUrl: noop, setError: noop, consolidateMessages: messages => messages };
  handleWebSocketMessage({ data: JSON.stringify(event('run_finished', 'old-terminal', { status: 'succeeded' })) } as MessageEvent, handlers);
  assert.equal(building, true);
  assert.equal(runId, 'new-run');
});

test('structured live results and persisted replay render the same tool with stable references', () => {
  const details = { version: 1, kind: 'write_files', changed_files: ['src/App.jsx'], file_count: 1, ok: true };
  const events = [event('tool_started', 'start', { call_id: 'call', details: { version: 1, paths: ['src/App.jsx'] } }),
    event('tool_completed', 'end', { call_id: 'call', ok: true, details, output: JSON.stringify(details) }),
    event('run_finished', 'done', { status: 'succeeded', message: 'Finished' })];
  const live = events.reduce(applyRunEvent, [] as Message[]);
  const replay = restoreRuns([], [{ id: 'run', status: 'succeeded', events }]);
  assert.deepEqual(live, replay);
  assert.equal(replay[0].tool_calls?.[0].event_id, 'end');
  assert.equal(replay[0].tool_calls?.[0].run_id, 'run');
  assert.deepEqual(replay[0].tool_calls?.[0].details, details);
  assert.equal(restoreRuns(replay, [{ id: 'run', status: 'succeeded', events }])[0].tool_calls?.length, 1);
});
