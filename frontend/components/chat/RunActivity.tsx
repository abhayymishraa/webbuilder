"use client";

// Interaction patterns adapted from Beautiful UI, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. All progress comes from recorded run events.
import { memo, useEffect, useState } from "react";
import { CheckIcon, Cross2Icon, FileTextIcon, ChevronRightIcon, ClockIcon, CopyIcon, Link2Icon } from "@radix-ui/react-icons";
import type { Message, ToolCall } from "@/lib/chat-types";
import { presentTool } from "@/lib/tool-presentation";
import styles from "./transcript.module.css";

export function CodeListing({ value, language = "output" }: { value: string; language?: string }) {
  return <div className={styles.code}><div className={styles.codeHeader}>{language}</div>
    <pre tabIndex={0} aria-label={`${language} listing`}><code>{value.split("\n").map((line, index) =>
      <span className={styles.codeLine} data-diff={language === "diff" ? line.startsWith("+") ? "add" : line.startsWith("-") ? "remove" : undefined : undefined} key={index}>
        <span aria-hidden="true" className={styles.lineNumber}>{index + 1}</span><span>{line || " "}</span>
      </span>)}</code></pre></div>;
}

function PixelLoader() {
  return <span className={styles.pixels} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 90}ms` }} />)}</span>;
}

function Elapsed({ start, end, running }: { start: string; end?: string; running: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const tick = () => { if (!document.hidden) setNow(Date.now()); };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [running]);
  const finish = end ? Date.parse(end) : running ? now : null;
  const seconds = finish === null ? NaN : Math.max(0, Math.floor((finish - Date.parse(start)) / 1000));
  if (!Number.isFinite(seconds)) return null;
  return <span className={styles.duration}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}

function RecordedResult({ output, label = "Recorded result" }: { output: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return <details className={styles.raw} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{label}</summary>
    {open && <CodeListing value={output} language="json" />}
  </details>;
}

function ToolCopyActions({ tool, value }: { tool: ToolCall; value: unknown }) {
  const [status, setStatus] = useState("");
  const copy = async (text: string, success: string) => {
    try { await navigator.clipboard.writeText(text); setStatus(success); }
    catch { setStatus("Copy failed. Select the visible text to copy it."); }
  };
  return <div className={styles.copyActions}>
    <button type="button" className={styles.utility} onClick={() => void copy(JSON.stringify({
      run_id: tool.run_id, call_id: tool.id, event_id: tool.event_id,
      tool: tool.name, status: tool.status, result: value,
    }, null, 2), "Result copied")}><CopyIcon aria-hidden="true" />Copy result</button>
    {tool.run_id && tool.id && <button type="button" className={styles.utility} onClick={() => void copy(
      `Run ${tool.run_id} / Tool ${tool.id}`, "Reference copied",
    )}><Link2Icon aria-hidden="true" />Copy reference</button>}
    <span className={styles.caption} role="status">{status}</span>
  </div>;
}

function ToolResult({ tool, result }: { tool: ToolCall; result: ReturnType<typeof presentTool> }) {
  const hasTerminal = Boolean(result.stdout || result.stderr || result.exitCode !== undefined);
  return <>
    {result.files.length > 0 && <div className={styles.context}>
      <span className={styles.caption}>{result.targetFiles ? "Target files" : result.changed ? "Updated files" : "Files read"}</span>
      <ul>{result.files.map(file => <li key={file}><FileTextIcon aria-hidden="true" /><span>{file}</span></li>)}</ul>
    </div>}
    {result.references.length > 0 && <div className={styles.context}>
      <span className={styles.caption}>Matched conversation messages</span>
      <ul>{result.references.map((id, index) => <li key={`${id}:${index}`}><span>{id}</span></li>)}</ul>
    </div>}
    {result.command && <CodeListing value={result.command} language="command" />}
    {result.inputOmitted && <p className={styles.caption}>Command text omitted from public activity.</p>}
    {result.truncatedFields.length > 0 && <p className={styles.caption}>Recorded excerpts only. Shortened fields: {result.truncatedFields.join(", ")}.</p>}
    {hasTerminal && <div className={styles.terminal}>
      {result.exitCode !== undefined && <span className={styles.caption}>Exit code {result.exitCode}</span>}
      {result.stdout && <CodeListing value={result.stdout} language="stdout" />}
      {result.stderr && <CodeListing value={result.stderr} language="stderr" />}
    </div>}
    {result.error && !hasTerminal && <CodeListing value={result.error} language="error" />}
    {result.parsed !== undefined
      ? <RecordedResult output={JSON.stringify(result.parsed, null, 2)} />
      : tool.output && !result.error && <CodeListing value={tool.output} />}
    {tool.status !== "running" && (result.parsed !== undefined || tool.output) && <ToolCopyActions tool={tool} value={result.parsed ?? tool.output} />}
    {!tool.output && result.parsed === undefined && <p className={styles.caption}>{tool.status === "running" ? "Waiting for the tool result…" : "No output was recorded."}</p>}
  </>;
}

const ToolRow = memo(function ToolRow({ tool }: { tool: ToolCall }) {
  const result = presentTool(tool);
  // Errors open by default. A user's explicit expand/collapse choice takes precedence.
  const [choice, setChoice] = useState<boolean | null>(null);
  const expanded = choice ?? tool.status === "error";
  return <details className={styles.tool} data-state={tool.status} open={expanded}
    onToggle={event => { if (event.currentTarget.open !== expanded) setChoice(event.currentTarget.open); }}>
    <summary><ChevronRightIcon className={styles.chevron} aria-hidden="true" />
      {tool.status === "running" ? <PixelLoader /> : tool.status === "success" ? <CheckIcon aria-hidden="true" /> : result.interrupted ? <ClockIcon aria-hidden="true" /> : <Cross2Icon aria-hidden="true" />}
      <span className={styles.toolInfo}>
        <span className={styles.toolName}>{result.title}</span>
        <span className={styles.toolSummary}>{result.summary}</span>
        {result.files.length > 0 && <span className={styles.fileChips}>
          {result.files.slice(0, 2).map(file => <span key={file} className={styles.fileChip} title={file}>{file}</span>)}
          {result.fileCount > 2 && <span className={styles.caption}>+{result.fileCount - Math.min(result.files.length, 2)} more</span>}
        </span>}
      </span>
      <span className={styles.toolMeta}>
        <span className={styles.caption}>{tool.status === "success" ? "Done" : result.interrupted ? "Stopped" : tool.status === "error" ? "Failed" : "Running"}</span>
        {typeof tool.duration_ms === "number" && <span className={styles.duration}>{(tool.duration_ms / 1000).toFixed(1)}s</span>}
      </span>
    </summary>
    {expanded && <div className={styles.result}><ToolResult tool={tool} result={result} /></div>}
  </details>;
});

function ToolList({ calls }: { calls: ToolCall[] }) {
  // Collapse only an uninterrupted prefix of successful calls: preserve event order
  // and never tuck a failed or running operation away in an older-results group.
  const firstUnfinished = calls.findIndex(tool => tool.status !== "success");
  const prefix = firstUnfinished === -1 ? calls.length : firstUnfinished;
  const hiddenCount = Math.min(prefix, Math.max(0, calls.length - 3));
  const count = hiddenCount >= 4 ? hiddenCount : 0;
  const [open, setOpen] = useState(false);
  return <div className={styles.tools}>
    {count > 0 && <details className={styles.trace} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary><ChevronRightIcon className={styles.chevron} aria-hidden="true" />{count} earlier completed operations</summary>
      {open && <div className={styles.tools}>{calls.slice(0, count).map((tool, i) => <ToolRow key={tool.id || i} tool={tool} />)}</div>}
    </details>}
    {calls.slice(count).map((tool, i) => <ToolRow key={tool.id || i + count} tool={tool} />)}
  </div>;
}

export function RunActivity({ message, connected }: { message: Message; connected: boolean }) {
  const running = message.run_status === "running";
  const failed = message.run_status && !["running", "succeeded", "cancelled"].includes(message.run_status);
  const steps = message.activity || [];
  const calls = message.tool_calls || [];
  const latest = steps.filter(item => item.kind === "stage").at(-1)?.message;
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
  return <div className={styles.run} data-failed={Boolean(failed)}>
    <div className={styles.runHeader}>
      <span role="status" className={styles.status}>{running && connected ? <PixelLoader /> : failed ? <Cross2Icon aria-hidden="true" /> : running || message.run_status === "cancelled" ? <ClockIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}{label}</span>
      <Elapsed start={message.created_at} end={message.finished_at} running={running} />
    </div>
    {steps.length > 0 && <details className={styles.trace}>
      <summary><ChevronRightIcon className={styles.chevron} aria-hidden="true" />Build steps <span className={styles.caption}>{steps.length}</span></summary>
      <ol>{steps.map(item => <li key={item.id} data-failed={item.ok === false}>
        <span className={styles.stageDot} /><div><p>{item.message || "Verification"}</p>
        {item.checks !== undefined && <RecordedResult label="Check results" output={JSON.stringify(item.checks, null, 2)} />}</div>
      </li>)}</ol>
    </details>}
    {calls.length > 0 && <ToolList calls={calls} />}
  </div>;
}
