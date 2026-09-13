import { ChevronDown, ChevronRight, Code2 } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/chat-types";

interface MessageBubbleProps {
  message: Message;
}

// Helper to detect and format JSON
function formatContent(content: string) {
  const parts: Array<{ type: "text" | "json" | "code"; content: string }> = [];

  // Split by double newlines first to separate sections
  const sections = content.split("\n\n");

  sections.forEach((section) => {
    section = section.trim();
    if (!section) return;

    // Try to detect JSON blocks with ```json wrapper
    const jsonBlockMatch = section.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      const textBefore = section.substring(0, jsonBlockMatch.index).trim();
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
      parts.push({ type: "json", content: jsonBlockMatch[1].trim() });
      const textAfter = section
        .substring(jsonBlockMatch.index! + jsonBlockMatch[0].length)
        .trim();
      if (textAfter) {
        parts.push({ type: "text", content: textAfter });
      }
      return;
    }

    // Check if entire section is JSON
    if (section.startsWith("{") && section.endsWith("}")) {
      try {
        JSON.parse(section);
        parts.push({ type: "json", content: section });
        return;
      } catch {
        // Not valid JSON, treat as text
      }
    }

    // Check for code blocks
    const codeBlockMatch = section.match(/```(\w+)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const textBefore = section.substring(0, codeBlockMatch.index).trim();
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
      parts.push({
        type: "code",
        content: codeBlockMatch[2].trim(),
      });
      const textAfter = section
        .substring(codeBlockMatch.index! + codeBlockMatch[0].length)
        .trim();
      if (textAfter) {
        parts.push({ type: "text", content: textAfter });
      }
      return;
    }

    // Otherwise it's text
    parts.push({ type: "text", content: section });
  });

  return parts.length > 0 ? parts : [{ type: "text" as const, content }];
}

function JsonBlock({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return (
      <pre className="my-3 p-3 text-xs font-mono text-muted-foreground bg-card border border-border rounded-lg overflow-x-auto">
        {content}
      </pre>
    );
  }
  const formatted = JSON.stringify(parsed, null, 2) ?? content;
  const lines = formatted.split("\n");
  const preview = lines.slice(0, 3).join("\n");
  const fields = parsed !== null && typeof parsed === "object"
    ? parsed as Record<string, unknown>
    : null;
  const title = [fields?.planTitle, fields?.title, fields?.name].find(
    (value): value is string => typeof value === "string" && value.length > 0,
  ) ?? "Implementation Plan";

  return (
    <div className="my-3 border border-border rounded-lg overflow-hidden bg-card">
      <button
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-accent transition-colors text-xs"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Code2 size={14} />
        <span className="text-secondary-foreground font-medium">{title}</span>
        <span className="text-muted-foreground text-[10px] ml-auto">
          {lines.length} lines •{" "}
          {isExpanded ? "Click to collapse" : "Click to expand"}
        </span>
      </button>
      {isExpanded && (
        <pre className="p-3 text-[11px] leading-relaxed font-mono text-secondary-foreground overflow-x-auto max-h-96 overflow-y-auto">
          {formatted}
        </pre>
      )}
      {!isExpanded && (
        <pre className="p-3 text-[11px] leading-relaxed font-mono text-muted-foreground">
          {preview}
          <span className="text-muted-foreground">...</span>
        </pre>
      )}
    </div>
  );
}

function CodeBlock({ content, lang }: { content: string; lang?: string }) {
  return (
    <div className="my-3 border border-border rounded-lg overflow-hidden bg-card">
      {lang && (
        <div className="px-3 py-1.5 bg-secondary text-[10px] text-muted-foreground font-mono border-b border-border">
          {lang}
        </div>
      )}
      <pre className="p-3 text-xs leading-relaxed font-mono text-secondary-foreground overflow-x-auto max-h-96 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

function CollapsibleText({ paragraphs }: { paragraphs: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayParagraphs = isExpanded ? paragraphs : paragraphs.slice(0, 5);

  return (
    <>
      {displayParagraphs.map((line, j) => (
        <p key={j} className="text-foreground whitespace-pre-wrap">
          {line}
        </p>
      ))}
      {paragraphs.length > 5 && (
        <button
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-secondary-foreground transition-colors flex items-center gap-1 mt-2"
        >
          {isExpanded ? (
            <>
              <ChevronDown size={12} />
              Show less
            </>
          ) : (
            <>
              <ChevronRight size={12} />
              Show {paragraphs.length - 5} more lines
            </>
          )}
        </button>
      )}
    </>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="ember-message-user">
        <div>
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ember-message-assistant">
      <span className="ember-message-label">WebBuilder</span>
      <div className="text-sm leading-relaxed space-y-2">
        {formatContent(message.content).map((part, i) => {
          if (part.type === "json") {
            return <JsonBlock key={i} content={part.content} />;
          } else if (part.type === "code") {
            return <CodeBlock key={i} content={part.content} />;
          } else {
            const paragraphs = part.content
              .split("\n")
              .filter((line) => line.trim());

            if (paragraphs.length > 10) {
              return <CollapsibleText key={i} paragraphs={paragraphs} />;
            }

            return paragraphs.map((line, j) => (
              <p
                key={`${i}-${j}`}
                className="text-foreground whitespace-pre-wrap"
              >
                {line}
              </p>
            ));
          }
        })}
      </div>
    </div>
  );
}
