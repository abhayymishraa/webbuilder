import type { Message, RunEvent, RunSnapshot, WebSocketHandlers } from './chat-types';

export function applyRunEvent(messages: Message[], event: RunEvent): Message[] {
  if (!event.run_id) return messages;
  const id = `run:${event.run_id}`;
  const existing = messages.find(m => m.id === id);
  const message: Message = existing ? { ...existing, tool_calls: [...(existing.tool_calls || [])] } : {
    id, role: 'assistant', content: '', created_at: event.created_at, event_type: 'run', tool_calls: [],
  };
  if (event.e === 'tool_started' || event.e === 'tool_completed') {
    if (!event.call_id) return messages;
    const calls = message.tool_calls!;
    const index = calls.findIndex(call => call.id === event.call_id);
    // A delayed start must never resurrect a completed call.
    if (event.e === 'tool_started' && index >= 0) return messages;
    const call = { id: event.call_id, name: event.name || 'Tool',
      status: event.e === 'tool_started' ? 'running' as const : event.ok ? 'success' as const : 'error' as const,
      output: event.output, duration_ms: event.duration_ms };
    if (index < 0) calls.push(call); else calls[index] = call;
  } else if (event.message) {
    message.content = event.message;
  }
  if (event.e === 'run_finished') {
    message.tool_calls = message.tool_calls?.map(call => call.status === 'running'
      ? { ...call, status: 'error', output: 'Run ended before this operation completed.' } : call);
  }
  return existing ? messages.map(m => m.id === id ? message : m) : [...messages, message];
}

export function restoreRuns(messages: Message[], runs: RunSnapshot[]): Message[] {
  let result = messages;
  for (const run of runs) {
    for (const event of run.events) result = applyRunEvent(result, event);
    if (run.status !== 'running') result = applyRunEvent(result, {
      e: 'run_finished', run_id: run.id, event_id: `${run.id}:terminal`, created_at: run.created_at || run.events[0]?.created_at || new Date(0).toISOString(),
      status: run.status, message: run.reason || `Run ${run.status}`,
    });
  }
  return result.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export function handleWebSocketMessage(event: MessageEvent, handlers: WebSocketHandlers) {
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'history') {
      const runs: RunSnapshot[] = data.runs || [];
      for (const run of runs) if (run.status !== 'running') handlers.terminalRuns.add(run.id);
      // New runs render their own terminal summary; preserve legacy chat history.
      const history = handlers.consolidateMessages((data.messages || []).filter((m: Message) => m.event_type !== 'run_summary' || !runs.some(run => run.id === m.id)));
      handlers.setMessages(restoreRuns(history, runs));
      const active = runs.find(run => run.status === 'running');
      handlers.setRunId(active?.id || null);
      handlers.setIsBuilding(Boolean(active));
      handlers.setAppUrl(data.app_url || null);
      const last = runs.at(-1);
      handlers.setError(last && last.status !== 'running' && last.status !== 'succeeded' ? last.reason || `Run ${last.status}` : null);
      return;
    }
    if (!data.run_id) return;
    if (handlers.terminalRuns.has(data.run_id)) return;
    handlers.setMessages(previous => applyRunEvent(previous, data));
    if (data.e === 'run_started' || data.e === 'stage' || data.e === 'tool_started') {
      handlers.setRunId(data.run_id);
      handlers.setIsBuilding(true);
    }
    if (data.e === 'run_finished') {
      handlers.terminalRuns.add(data.run_id);
      handlers.setRunId(null);
      handlers.setIsBuilding(false);
      handlers.setError(data.status === 'succeeded' ? null : data.message);
      if (data.status === 'succeeded' && data.url) handlers.setAppUrl(data.url);
      else handlers.setAppUrl(null);
    }
  } catch {
    handlers.setError('Could not read a progress update. Reconnect to reload run status.');
  }
}
