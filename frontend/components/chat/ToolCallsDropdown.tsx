import { ChevronDown, Loader2 } from "lucide-react";

import type { ToolCall } from "@/lib/chat-types";

interface ToolCallsDropdownProps {
  toolCalls: ToolCall[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ToolCallsDropdown({
  toolCalls,
  isExpanded,
  onToggle,
}: ToolCallsDropdownProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="border-t border-border bg-card px-4 py-2">
      <button
        aria-expanded={isExpanded}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-sm text-secondary-foreground hover:text-foreground transition-colors py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">Tools</span>
          <span className="font-medium">
            {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}{" "}
            recorded
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 mb-3 space-y-2 max-h-64 overflow-y-auto">
          {toolCalls.map((tool, idx) => (
            <div
              key={tool.id || idx}
              className="flex items-start gap-3 text-xs px-4 py-3 bg-background border border-border rounded-lg hover:border-border transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary shrink-0 mt-0.5">
                {tool.status === "success" ? (
                  <span className="text-green-700 dark:text-green-400 text-sm">✓</span>
                ) : tool.status === "error" ? (
                  <span className="text-red-700 dark:text-red-400 text-sm">✗</span>
                ) : (
                  <Loader2 size={14} className="animate-spin text-amber-700 dark:text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-medium mb-1">
                  {tool.name}
                  {tool.duration_ms !== undefined && (
                    <span className="ml-2 text-muted-foreground">
                      {(tool.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {tool.output && (
                  <div className="text-muted-foreground text-[11px] leading-relaxed wrap-break-word">
                    {tool.output}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
