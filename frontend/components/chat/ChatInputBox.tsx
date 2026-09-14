import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowUp, Loader2, Plus } from "lucide-react";
import { MAX_PROJECT_DRAFT_LENGTH } from "@/lib/project-draft";
import { starterBriefs } from "@/lib/starter-briefs";
import styles from "./ember-start.module.css";

interface ChatInputBoxProps {
  input: string;
  isLoading: boolean;
  disabled?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInputBox({
  input,
  isLoading,
  disabled = false,
  onInputChange,
  onSubmit,
}: ChatInputBoxProps) {
  const field = useRef<HTMLInputElement>(null);
  const [showExamples, setShowExamples] = useState(false);
  const controlsDisabled = isLoading || disabled;
  const submitLabel = isLoading ? "Starting your project" : "Start building";

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={isLoading}
      className={`${styles.composer} relative rounded-2xl border border-border bg-card p-3 text-left focus-within:border-input sm:p-4`}
    >
      <label htmlFor="project-brief" className="sr-only">
        Describe your app idea
      </label>
      <Input
        ref={field}
        id="project-brief"
        aria-describedby="project-brief-note"
        className="h-12 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0 sm:text-lg"
        placeholder="Hey WebBuilder, let’s make…"
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={controlsDisabled}
        maxLength={MAX_PROJECT_DRAFT_LENGTH}
        autoComplete="off"
        required
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <Button
          variant="utility"
          type="button"
          disabled={controlsDisabled}
          className="gap-2 px-2"
          aria-expanded={showExamples}
          aria-controls="project-brief-examples"
          onClick={() => setShowExamples(!showExamples)}
        >
          <Plus size={16} aria-hidden="true" /> Start with an example
        </Button>
        <Button
          type="submit"
          disabled={controlsDisabled || !input.trim()}
          className="size-11 shrink-0 rounded-full p-0"
          aria-label={submitLabel}
          title={submitLabel}
        >
          {isLoading ? (
            <Loader2
              size={19}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <ArrowUp size={19} aria-hidden="true" />
          )}
        </Button>
      </div>
      <div id="project-brief-examples" hidden={!showExamples}>
        <div className="mt-3 grid gap-1 border-t border-border pt-3 sm:grid-cols-3">
          {starterBriefs.map((starter) => (
            <Button
              key={starter.id}
              type="button"
              variant="utility"
              disabled={controlsDisabled}
              className="justify-between px-3"
              onClick={() => {
                onInputChange(starter.prompt);
                setShowExamples(false);
                field.current?.focus();
              }}
            >
              {starter.title}
              <ArrowRight size={14} aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
      <span className="sr-only" role="status">
        {isLoading
          ? "Starting your project…"
          : disabled
            ? "Loading your account…"
            : ""}
      </span>
    </form>
  );
}
