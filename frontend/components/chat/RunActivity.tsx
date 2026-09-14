"use client";
import { Button } from "@/components/ui/button";

// Interaction patterns adapted from Beautiful UI, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. All progress comes from recorded run events.
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  Cross2Icon,
  FileTextIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  Link2Icon,
} from "@radix-ui/react-icons";
import type { Message, ToolCall } from "@/lib/chat-types";
import { presentTool } from "@/lib/tool-presentation";
import styles from "./transcript.module.css";

export function CodeListing({
  value,
  language = "output",
}: {
  value: string;
  language?: string;
}) {
  return (
    <div className="transcript-code min-w-0 max-w-full border border-border rounded-[4px] my-2 mx-0 bg-background whitespace-normal [&_pre]:overflow-auto [&_pre]:max-h-70 [&_pre]:m-0 [&_pre]:py-2 [&_pre]:px-0 [&_pre]:[font:11px/1.75_ui-monospace,_monospace] [&_pre]:whitespace-pre [&_pre:focus-visible]:outline-2 [&_pre:focus-visible]:outline-solid [&_pre:focus-visible]:outline-primary [&_pre:focus-visible]:outline-offset-0.5">
      <div className="transcript-codeHeader font-mono text-[11px] text-muted-foreground py-[7px] px-2.5 border-b border-b-border">
        {language}
      </div>
      <pre tabIndex={0} aria-label={`${language} listing`}>
        <code>
          {value.split("\n").map((line, index) => (
            <span
              className="transcript-codeLine flex min-w-max [&>span:last-child]:pr-3 [&[data-diff=add]]:bg-[#319d4920] [&[data-diff=remove]]:bg-[#dc504320]"
              data-diff={
                language === "diff"
                  ? line.startsWith("+")
                    ? "add"
                    : line.startsWith("-")
                      ? "remove"
                      : undefined
                  : undefined
              }
              key={index}
            >
              <span
                aria-hidden="true"
                className="transcript-lineNumber w-9.5 pr-2.5 shrink-0 text-right text-muted-foreground select-none opacity-65"
              >
                {index + 1}
              </span>
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function PixelLoader() {
  return (
    <span className={styles.pixels + " transcript-pixels"} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

function Elapsed({
  start,
  end,
  running,
}: {
  start: string;
  end?: string;
  running: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (!document.hidden) setNow(Date.now());
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);
  const finish = end ? Date.parse(end) : running ? now : null;
  const seconds =
    finish === null
      ? NaN
      : Math.max(0, Math.floor((finish - Date.parse(start)) / 1000));
  if (!Number.isFinite(seconds)) return null;
  return (
    <span className="transcript-duration font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
    </span>
  );
}

function RecordedResult({
  output,
  label = "Recorded result",
}: {
  output: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="transcript-raw min-w-0 [&>summary]:cursor-pointer [&>summary]:min-h-9 [&>summary]:flex [&>summary]:items-center [&>summary]:text-[11px] [&>summary]:text-muted-foreground [&>summary]:underline [&>summary]:underline-offset-[3px]"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{label}</summary>
      {open && <CodeListing value={output} language="json" />}
    </details>
  );
}

function ToolCopyActions({ tool, value }: { tool: ToolCall; value: unknown }) {
  const [status, setStatus] = useState("");
  const copy = async (text: string, success: string) => {
    setStatus("");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(success, { id: "tool-copy" });
    } catch {
      setStatus("Copy failed. Select the visible text to copy it.");
    }
  };
  return (
    <div className="transcript-copyActions flex items-center flex-wrap gap-y-1 gap-x-3 mt-1.5">
      <Button
        type="button"
        variant="utility"
        onClick={() =>
          void copy(
            JSON.stringify(
              {
                run_id: tool.run_id,
                call_id: tool.id,
                event_id: tool.event_id,
                tool: tool.name,
                status: tool.status,
                result: value,
              },
              null,
              2,
            ),
            "Result copied",
          )
        }
      >
        <CopyIcon aria-hidden="true" />
        Copy result
      </Button>
      {tool.run_id && tool.id && (
        <Button
          type="button"
          variant="utility"
          onClick={() =>
            void copy(
              `Run ${tool.run_id} / Tool ${tool.id}`,
              "Reference copied",
            )
          }
        >
          <Link2Icon aria-hidden="true" />
          Copy reference
        </Button>
      )}
      <span
        className="transcript-caption font-mono text-[11px] text-muted-foreground"
        role="status"
      >
        {status}
      </span>
    </div>
  );
}

function ToolResult({
  tool,
  result,
}: {
  tool: ToolCall;
  result: ReturnType<typeof presentTool>;
}) {
  const hasTerminal = Boolean(
    result.stdout || result.stderr || result.exitCode !== undefined,
  );
  return (
    <>
      {result.files.length > 0 && (
        <div className="transcript-context border-l-2 border-l-primary pl-2.5 mt-1 mx-0 mb-2 [&_ul]:list-none [&_ul]:mt-[7px] [&_ul]:mx-0 [&_ul]:mb-0 [&_ul]:p-0 [&_li]:flex [&_li]:items-baseline [&_li]:gap-[7px] [&_li]:[font:11px/1.8_ui-monospace,_monospace] [&_li]:text-secondary-foreground [&_li_svg]:shrink-0 [&_li_svg]:w-3 [&_li_span]:wrap-anywhere">
          <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
            {result.targetFiles
              ? "Target files"
              : result.changed
                ? "Updated files"
                : "Files read"}
          </span>
          <ul>
            {result.files.map((file) => (
              <li key={file}>
                <FileTextIcon aria-hidden="true" />
                <span>{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.references.length > 0 && (
        <div className="transcript-context border-l-2 border-l-primary pl-2.5 mt-1 mx-0 mb-2 [&_ul]:list-none [&_ul]:mt-[7px] [&_ul]:mx-0 [&_ul]:mb-0 [&_ul]:p-0 [&_li]:flex [&_li]:items-baseline [&_li]:gap-[7px] [&_li]:[font:11px/1.8_ui-monospace,_monospace] [&_li]:text-secondary-foreground [&_li_svg]:shrink-0 [&_li_svg]:w-3 [&_li_span]:wrap-anywhere">
          <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
            Matched conversation messages
          </span>
          <ul>
            {result.references.map((id, index) => (
              <li key={`${id}:${index}`}>
                <span>{id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.command && (
        <CodeListing value={result.command} language="command" />
      )}
      {result.inputOmitted && (
        <p className="transcript-caption font-mono text-[11px] text-muted-foreground">
          Command text omitted from public activity.
        </p>
      )}
      {result.truncatedFields.length > 0 && (
        <p className="transcript-caption font-mono text-[11px] text-muted-foreground">
          Recorded excerpts only. Shortened fields:{" "}
          {result.truncatedFields.join(", ")}.
        </p>
      )}
      {hasTerminal && (
        <div className="transcript-terminal pt-1">
          {result.exitCode !== undefined && (
            <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
              Exit code {result.exitCode}
            </span>
          )}
          {result.stdout && (
            <CodeListing value={result.stdout} language="stdout" />
          )}
          {result.stderr && (
            <CodeListing value={result.stderr} language="stderr" />
          )}
        </div>
      )}
      {result.error && !hasTerminal && (
        <CodeListing value={result.error} language="error" />
      )}
      {result.parsed !== undefined ? (
        <RecordedResult output={JSON.stringify(result.parsed, null, 2)} />
      ) : (
        tool.output && !result.error && <CodeListing value={tool.output} />
      )}
      {tool.status !== "running" &&
        (result.parsed !== undefined || tool.output) && (
          <ToolCopyActions tool={tool} value={result.parsed ?? tool.output} />
        )}
      {!tool.output && result.parsed === undefined && (
        <p className="transcript-caption font-mono text-[11px] text-muted-foreground">
          {tool.status === "running"
            ? "Waiting for the tool result…"
            : "No output was recorded."}
        </p>
      )}
    </>
  );
}

const ToolRow = memo(function ToolRow({ tool }: { tool: ToolCall }) {
  const result = presentTool(tool);
  // Errors open by default. A user's explicit expand/collapse choice takes precedence.
  const [choice, setChoice] = useState<boolean | null>(null);
  const expanded = choice ?? tool.status === "error";
  return (
    <details
      className={
        styles.tool +
        " transcript-tool [&[data-state=error]>summary]:text-destructive [&>summary]:list-none [&>summary]:flex [&>summary]:gap-2 [&>summary]:cursor-pointer [&>summary]:min-h-11 [&>summary]:text-[12px] [&>summary::-webkit-details-marker]:hidden [&[open]>summary>.transcript-chevron]:rotate-90 border border-border bg-card rounded-[5px] min-w-0 [&>summary:hover]:bg-secondary [&[data-state=running]]:border-primary [&[data-state=success]>summary>svg:not(.transcript-chevron)]:text-accent-foreground max-[481px]:[&>summary]:py-0 max-[481px]:[&>summary]:px-2 max-[481px]:[&>summary]:gap-1.5 [&>summary]:items-start [&>summary]:py-[11px] [&>summary]:px-2.5 [&[data-state=error]_.transcript-toolSummary]:text-destructive"
      }
      data-state={tool.status}
      open={expanded}
      onToggle={(event) => {
        if (event.currentTarget.open !== expanded)
          setChoice(event.currentTarget.open);
      }}
    >
      <summary>
        <ChevronRightIcon
          className="transcript-chevron w-[13px] shrink-0 [transition:transform_.18s_ease-out] motion-reduce:[transition:none]"
          aria-hidden="true"
        />
        {tool.status === "running" ? (
          <PixelLoader />
        ) : tool.status === "success" ? (
          <CheckIcon aria-hidden="true" />
        ) : result.interrupted ? (
          <ClockIcon aria-hidden="true" />
        ) : (
          <Cross2Icon aria-hidden="true" />
        )}
        <span className="transcript-toolInfo flex flex-col flex-1 gap-1 min-w-0">
          <span
            className={
              styles.toolName +
              " transcript-toolName flex-1 min-w-0 wrap-anywhere font-medium"
            }
          >
            {result.title}
          </span>
          <span className="transcript-toolSummary text-muted-foreground text-[12px] leading-[1.5] wrap-anywhere">
            {result.summary}
          </span>
          {result.files.length > 0 && (
            <span className="transcript-fileChips flex flex-wrap items-center gap-[5px] mt-0.5 min-w-0">
              {result.files.slice(0, 2).map((file) => (
                <span
                  key={file}
                  className="transcript-fileChip max-w-full overflow-hidden text-ellipsis whitespace-nowrap border border-border rounded-[3px] py-0.5 px-[5px] text-secondary-foreground bg-background [font:11px/1.5_ui-monospace,_monospace]"
                  title={file}
                >
                  {file}
                </span>
              ))}
              {result.fileCount > 2 && (
                <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
                  +{result.fileCount - Math.min(result.files.length, 2)} more
                </span>
              )}
            </span>
          )}
        </span>
        <span className="transcript-toolMeta flex flex-col items-end gap-[5px] pt-[1px] shrink-0">
          <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
            {tool.status === "success"
              ? "Done"
              : result.interrupted
                ? "Stopped"
                : tool.status === "error"
                  ? "Failed"
                  : "Running"}
          </span>
          {typeof tool.duration_ms === "number" && (
            <span className="transcript-duration font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
              {(tool.duration_ms / 1000).toFixed(1)}s
            </span>
          )}
        </span>
      </summary>
      {expanded && (
        <div className="transcript-result pt-0 px-3 pb-3 min-w-0">
          <ToolResult tool={tool} result={result} />
        </div>
      )}
    </details>
  );
});

function ToolList({ calls }: { calls: ToolCall[] }) {
  // Collapse only an uninterrupted prefix of successful calls: preserve event order
  // and never tuck a failed or running operation away in an older-results group.
  const firstUnfinished = calls.findIndex((tool) => tool.status !== "success");
  const prefix = firstUnfinished === -1 ? calls.length : firstUnfinished;
  const hiddenCount = Math.min(prefix, Math.max(0, calls.length - 3));
  const count = hiddenCount >= 4 ? hiddenCount : 0;
  const [open, setOpen] = useState(false);
  return (
    <div className="transcript-tools grid gap-[5px]">
      {count > 0 && (
        <details
          className="transcript-trace [&_li[data-failed=true]]:text-destructive [&>summary]:list-none [&>summary]:flex [&>summary]:items-center [&>summary]:gap-2 [&>summary]:cursor-pointer [&>summary]:min-h-11 [&>summary]:text-[12px] [&>summary::-webkit-details-marker]:hidden [&[open]>summary>.transcript-chevron]:rotate-90 [&>summary]:text-muted-foreground [&_ol]:list-none [&_ol]:pt-0 [&_ol]:pr-0 [&_ol]:pb-2 [&_ol]:pl-[7px] [&_ol]:m-0 [&_li]:flex [&_li]:items-baseline [&_li]:gap-3 [&_li]:py-1.5 [&_li]:px-0 [&_li]:text-muted-foreground [&_li]:text-[12px] [&_li]:wrap-anywhere [&_li>div]:min-w-0 [&_li>div]:flex-1 [&_p]:m-0"
          open={open}
          onToggle={(event) => setOpen(event.currentTarget.open)}
        >
          <summary>
            <ChevronRightIcon
              className="transcript-chevron w-[13px] shrink-0 [transition:transform_.18s_ease-out] motion-reduce:[transition:none]"
              aria-hidden="true"
            />
            {count} earlier completed operations
          </summary>
          {open && (
            <div className="transcript-tools grid gap-[5px]">
              {calls.slice(0, count).map((tool, i) => (
                <ToolRow key={tool.id || i} tool={tool} />
              ))}
            </div>
          )}
        </details>
      )}
      {calls.slice(count).map((tool, i) => (
        <ToolRow key={tool.id || i + count} tool={tool} />
      ))}
    </div>
  );
}

export function RunActivity({
  message,
  connected,
}: {
  message: Message;
  connected: boolean;
}) {
  const completionIcon = useRef<SVGSVGElement>(null);
  const [pointerReveal, setPointerReveal] = useState(false);
  const previousRun = useRef({ id: message.id, status: message.run_status });

  useEffect(() => {
    const previous = previousRun.current;
    previousRun.current = { id: message.id, status: message.run_status };
    // Celebrate only a live transition, never an already-completed history entry.
    if (previous.id !== message.id || previous.status !== "running" || message.run_status !== "succeeded") return;
    const icon = completionIcon.current;
    if (!icon?.animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const easing = getComputedStyle(icon).getPropertyValue("--ease-out").trim();
    const animation = icon.animate(
      reduced
        ? [{ opacity: 0.6 }, { opacity: 1 }]
        : [{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: reduced ? 80 : 180, easing: easing || "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    return () => animation.cancel();
  }, [message.id, message.run_status]);

  const running = message.run_status === "running";
  const failed =
    message.run_status &&
    !["running", "succeeded", "cancelled"].includes(message.run_status);
  const steps = message.activity || [];
  const calls = message.tool_calls || [];
  const latest = steps.filter((item) => item.kind === "stage").at(-1)?.message;
  let label = "Recorded steps";
  if (running) {
    label = connected ? latest || "Working on your app" : "Reconnecting to run";
  } else if (message.run_status === "succeeded") {
    label = "Build complete";
  } else if (message.run_status === "cancelled") {
    label = "Run stopped";
  } else if (failed) {
    label = "Run needs attention";
  }
  return (
    <div
      className="transcript-run min-w-0 mt-2 [&[data-failed=true]_.transcript-status]:text-destructive"
      data-failed={Boolean(failed)}
    >
      <div className="transcript-runHeader flex items-baseline justify-between gap-3 pt-1 px-0 pb-2.5 max-[481px]:gap-2">
        <span
          role="status"
          className="transcript-status flex items-center gap-[9px] text-[13px] leading-[1.5] text-foreground wrap-anywhere [&>svg]:shrink-0"
        >
          {running && connected ? (
            <PixelLoader />
          ) : failed ? (
            <Cross2Icon aria-hidden="true" />
          ) : running || message.run_status === "cancelled" ? (
            <ClockIcon aria-hidden="true" />
          ) : (
            <CheckIcon ref={completionIcon} className="origin-center [transform-box:fill-box]" aria-hidden="true" />
          )}
          {label}
        </span>
        <Elapsed
          start={message.created_at}
          end={message.finished_at}
          running={running}
        />
      </div>
      {(steps.length > 0 || calls.length > 0) && (
        <details data-pointer-reveal={pointerReveal} className={`${styles.buildTrace} transcript-trace [&>summary]:list-none [&>summary]:flex [&>summary]:items-center [&>summary]:gap-2 [&>summary]:cursor-pointer [&>summary]:min-h-11 [&>summary]:text-[12px] [&>summary::-webkit-details-marker]:hidden [&[open]>summary>.transcript-chevron]:rotate-90 [&>summary]:text-muted-foreground`}>
          <summary onClick={(event) => setPointerReveal(event.detail > 0)} onKeyDown={() => setPointerReveal(false)}>
            <ChevronRightIcon
              className="transcript-chevron w-[13px] shrink-0 [transition:transform_.18s_ease-out] motion-reduce:[transition:none]"
              aria-hidden="true"
            />
            Build steps{" "}
            <span className="transcript-caption font-mono text-[11px] text-muted-foreground">
              {steps.length || calls.length}
            </span>
          </summary>
          <div className={styles.buildDetails}>
          <ol className="list-none pt-0 pr-0 pb-2 pl-[7px] m-0 [&>li]:flex [&>li]:items-baseline [&>li]:gap-3 [&>li]:py-1.5 [&>li]:px-0 [&>li]:text-muted-foreground [&>li]:text-[12px] [&>li]:wrap-anywhere [&>li[data-failed=true]]:text-destructive [&>li>div]:min-w-0 [&>li>div]:flex-1 [&_p]:m-0">
            {steps.map((item) => (
              <li key={item.id} data-failed={item.ok === false}>
                <span className="transcript-stageDot [flex:0_0_4px] h-1 bg-current rounded-full" />
                <div>
                  <p>{item.message || "Verification"}</p>
                  {item.checks !== undefined && (
                    <RecordedResult
                      label="Check results"
                      output={JSON.stringify(item.checks, null, 2)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
          {calls.length > 0 && <ToolList calls={calls} />}
          </div>
        </details>
      )}
    </div>
  );
}
