"use client";

// Interaction patterns adapted from Beautiful UI, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. All progress comes from recorded run events.
import { presentTool } from "@/lib/tool-presentation";
import type { ToolCall } from "@/types/chat.type";
import { CheckIcon, ChevronRightIcon, ClockIcon, Cross2Icon } from "@radix-ui/react-icons";
import { memo, useState } from "react";
import styles from "./transcript.module.css";

import { PixelLoader } from "./RunStatus";
import { ToolResult } from "./ToolResult";
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
                if (event.currentTarget.open !== expanded) setChoice(event.currentTarget.open);
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

export function ToolList({ calls }: { calls: ToolCall[] }) {
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
