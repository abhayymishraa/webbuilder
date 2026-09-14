import { Button } from "@/components/ui/button";
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
    <form
      onSubmit={onSubmit}
      className="ember-composer border border-input bg-card rounded-[14px] p-4 flex flex-col gap-3 focus-within:border-ring"
      aria-busy={isLoading}
    >
      <label className="sr-only" htmlFor="project-brief">
        Describe your app
      </label>
      <textarea
        className="w-full min-h-[75px] text-[15px] max-h-52.5 resize-y border-0 bg-transparent text-foreground leading-[1.65] outline-none placeholder:text-muted-foreground focus-visible:outline-none max-md:text-[16px]"
        id="project-brief"
        placeholder="A reading list for my book club, a portfolio for my work…"
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={isLoading}
        rows={4}
        required
      />
      <div className="ember-composer-footer flex items-center justify-between gap-[15px] [&>span]:text-[11px] [&>span]:text-muted-foreground">
        <span>A clear brief is a good beginning.</span>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          variant="default"
          aria-label={isLoading ? "Starting your project" : "Start building"}
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <ArrowUp size={17} />
          )}
          <span>{isLoading ? "Starting…" : "Start building"}</span>
        </Button>
      </div>
    </form>
  );
}
