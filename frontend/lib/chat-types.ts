export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out' | 'interrupted';
export interface ToolCall {
  id?: string;
  name: string;
  status: 'success' | 'error' | 'running';
  output?: string;
  duration_ms?: number;
}
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  event_type?: string;
  tool_calls?: ToolCall[];
}
export interface RunEvent {
  e: string;
  run_id: string;
  event_id: string;
  created_at: string;
  name?: string;
  call_id?: string;
  ok?: boolean;
  status?: RunStatus;
  message?: string;
  output?: string;
  duration_ms?: number;
  url?: string | null;
}
export interface RunSnapshot {
  id: string;
  created_at?: string;
  status: RunStatus;
  reason?: string;
  events: RunEvent[];
}
export interface WebSocketHandlers {
  terminalRuns: Set<string>;
  setIsBuilding: (value: boolean) => void;
  setRunId: (id: string | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setAppUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  consolidateMessages: (messages: Message[]) => Message[];
}
