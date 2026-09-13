// Composer structure adapted from Beautiful UI ChatComposer, MIT © 2026 Shane Levine.
// See ../ember/BEAUTIFUL-UI-LICENSE. The parent owns the real run lifecycle.
import { useState, useRef } from "react";
import { ArrowUpIcon, StopIcon, FileTextIcon, MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";
import styles from "./transcript.module.css";

const commands = [
  { name: "Improve layout", prompt: "Improve the layout and spacing of this app. " },
  { name: "Check accessibility", prompt: "Review and improve the accessibility of this app. " },
  { name: "Fix an issue", prompt: "Fix this issue in my app: " },
  { name: "Explain the code", prompt: "Explain how the current app works. " },
];

interface ChatInputProps {
  files?: string[];
  input: string;
  wsConnected: boolean;
  isBuilding: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  canCancel: boolean;
}

export function ChatInput({
  files = [],
  input,
  wsConnected,
  isBuilding,
  onInputChange,
  onSubmit,
  onCancel,
  canCancel,
}: ChatInputProps) {
  const [menu, setMenu] = useState<"files" | "commands" | null>(null);
  const [query, setQuery] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const normalizedQuery = query.toLowerCase();
  const choices = (menu === "files" ? files.map(file => ({ name: file, prompt: `@${file} ` })) : commands)
    .filter(item => item.name.toLowerCase().includes(normalizedQuery));
  const closeMenu = () => { setMenu(null); setQuery(""); textarea.current?.focus(); };
  const openMenu = (next: "files" | "commands") => { setMenu(next); setQuery(""); };
  return (
    <div className="ember-chat-input">
      <form className={`ember-composer ${styles.composer}`} onSubmit={onSubmit}>
        {menu && !isBuilding && wsConnected && <div className={styles.menu} role="dialog" aria-label={menu === "files" ? "Reference project files" : "Prompt commands"} onKeyDown={event => {
          if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
        }}>
          <div className={styles.menuHeader}><MagnifyingGlassIcon aria-hidden="true" />
            <input autoFocus value={query} onChange={event => setQuery(event.target.value)} aria-label={menu === "files" ? "Search project files" : "Search commands"} placeholder={menu === "files" ? "Search project files…" : "Search commands…"} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} />
            <button className={styles.utility} type="button" onClick={closeMenu} aria-label="Close search"><Cross2Icon /></button>
          </div>
          <div className={styles.options}>
            {choices.map(item => <button type="button" className={styles.option} key={item.name} onClick={() => {
              onInputChange(`${input}${input && !/\s$/.test(input) ? " " : ""}${item.prompt}`); closeMenu();
            }}>{item.name}</button>)}
            {!choices.length && <p className={styles.empty}>{menu === "files" && !files.length ? "Saved files will appear after your first build." : "No matches. Try a different search."}</p>}
          </div>
          <p className={styles.caption}>{menu === "files" ? "Adds a file reference to your message." : "Choose a starting prompt. Edit it before sending."}</p>
        </div>}
        <label htmlFor="chat-prompt" className="sr-only">
          Describe a change to your app
        </label>
        <textarea
          ref={textarea}
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
          <div className={styles.composerTools}>
            <button type="button" className={styles.utility} disabled={!wsConnected || isBuilding} aria-label="Reference project files" aria-expanded={menu === "files"} onClick={() => openMenu("files")}><FileTextIcon aria-hidden="true" /><span>@</span></button>
            <button type="button" className={styles.utility} disabled={!wsConnected || isBuilding} aria-label="Prompt commands" aria-expanded={menu === "commands"} onClick={() => openMenu("commands")}>/</button>
          </div>
          <span className="ember-connection" data-connected={wsConnected}>
            {isBuilding
              ? "Working on your app"
              : wsConnected
                ? "Connected"
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
              <StopIcon />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="ember-button ember-send"
              disabled={!wsConnected || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUpIcon />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
