// Composer structure adapted from Beautiful UI ChatComposer, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. The parent owns the real run lifecycle.
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  wsConnected: boolean;
  isBuilding: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  canCancel: boolean;
}

export function ChatInput({
  input,
  wsConnected,
  isBuilding,
  onInputChange,
  onSubmit,
  onCancel,
  canCancel,
}: ChatInputProps) {
  return (
    <div className="ember-chat-input">
      <form className="ember-composer" onSubmit={onSubmit}>
        <label htmlFor="chat-prompt" className="sr-only">
          Describe a change to your app
        </label>
        <textarea
          id="chat-prompt"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (wsConnected && !isBuilding && input.trim())
                event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Describe a change to your app…"
          disabled={!wsConnected || isBuilding}
          rows={2}
        />
        <div className="ember-composer-footer">
          <span className="ember-connection" data-connected={wsConnected}>
            {isBuilding
              ? "Working on your app"
              : wsConnected
                ? "Connected · Shift + Enter for a new line"
                : "Reconnecting to your project…"}
          </span>
          {isBuilding ? (
            <button
              type="button"
              className="ember-button"
              onClick={onCancel}
              disabled={!canCancel}
              aria-label="Stop the current run"
            >
              <Square size={14} />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="ember-button ember-send"
              disabled={!wsConnected || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUp size={17} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
