"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import type { Message } from "@/lib/chat-types";
import { CodeListing, RunActivity } from "./RunActivity";
import styles from "./transcript.module.css";

function MessageContent({ content }: { content: string }) {
  // Parse complete fences before paragraphs so blank lines inside code survive.
  const parts = content.split(/(```[^\n]*\n[\s\S]*?```)/g);
  return <div className={styles.answer}>{parts.map((part, i) => {
    const fence = part.match(/^```([^\n]*)\n([\s\S]*?)```$/);
    if (fence) return <CodeListing key={i} value={fence[2].replace(/\n$/, "")} language={fence[1].trim() || "code"} />;
    return part.trim() ? <p key={i}>{part}</p> : null;
  })}</div>;
}

export function MessageBubble({ message, connected = true }: { message: Message; connected?: boolean }) {
  const [copyStatus, setCopyStatus] = useState("");
  if (message.role === "user") return <div className="ember-message-user"><div><p className={styles.userText}>{message.content}</p></div></div>;
  const hasRun = Boolean(message.run_status || message.tool_calls?.length || message.activity?.length);
  return <article className={`ember-message-assistant ${styles.message}`} aria-label="WebBuilder response">
    <span className="ember-message-label">WebBuilder</span>
    {hasRun && <RunActivity message={message} connected={connected} />}
    {message.content && <>
      <MessageContent content={message.content} />
      {message.run_status !== "running" && <div className={styles.responseActions}>
        <button type="button" className={styles.utility} aria-label="Copy response" onClick={async () => {
          try { await navigator.clipboard.writeText(message.content); setCopyStatus("Copied"); }
          catch { setCopyStatus("Could not copy. Select the response text to copy it."); }
        }}>{copyStatus === "Copied" ? <CheckIcon /> : <CopyIcon />}</button>
        <span role="status" className={styles.caption}>{copyStatus}</span>
      </div>}
    </>}
  </article>;
}
