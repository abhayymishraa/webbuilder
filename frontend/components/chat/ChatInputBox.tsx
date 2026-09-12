import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputBoxProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInputBox({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputBoxProps) {
  return (
    <form onSubmit={onSubmit} className="ember-composer" aria-busy={isLoading}>
      <label className="sr-only" htmlFor="project-brief">
        Describe your app
      </label>
      <textarea
        id="project-brief"
        placeholder="A reading list for my book club, a portfolio for my work…"
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={isLoading}
        rows={4}
        required
      />
      <div className="ember-composer-footer">
        <span>A clear brief is a good beginning.</span>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="ember-button"
          aria-label={isLoading ? "Starting your project" : "Start building"}
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <ArrowUp size={17} />
          )}
          <span>{isLoading ? "Starting…" : "Start building"}</span>
        </button>
      </div>
    </form>
  );
}
