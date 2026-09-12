"use client";

import { useRef, useState } from "react";
import { ArrowRight, Asterisk, Plus, X } from "lucide-react";
import styles from "./ember-prompt.module.css";
import { StudyNav } from "../_components/StudyNav";

const examples = [
  { label: "A portfolio", prompt: "a beautiful portfolio for my cow" },
  { label: "A personal space", prompt: "a quiet reading room for my favourite books" },
  { label: "Something useful", prompt: "a simple habit tracker that celebrates small wins" },
];

export function EmberPrompt() {
  const [prompt, setPrompt] = useState("");
  const [brief, setBrief] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  function dismiss() {
    dialog.current?.close();
    input.current?.focus();
  }

  return (
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <StudyNav active="prompt" />

      <section className={styles.hero} aria-labelledby="prompt-heading">
        <div className={styles.wordmark}>
          <Asterisk size={25} strokeWidth={1.6} aria-hidden="true" />
          <span>webbuilder</span>
        </div>
        <h1 id="prompt-heading">
          The right prompt.
          <br />
          Your next <em>big idea.</em>
        </h1>
        <p className={styles.intro}>Every great thing begins with a little spark.</p>

        <div className={styles.promptArea}>
          <form
            className={styles.prompt}
            onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim()) return;
              setBrief(prompt.trim());
              dialog.current?.showModal();
            }}
          >
            <button
              type="button"
              className={styles.newPrompt}
              aria-label="Start a new prompt"
              onClick={() => {
                setPrompt("");
                input.current?.focus();
              }}
            >
              <Plus size={28} strokeWidth={1.2} aria-hidden="true" />
            </button>
            <label className={styles.create} htmlFor="ember-concept-prompt">Create</label>
            <div className={styles.inputWrap}>
              <div className={styles.beam} aria-hidden="true" />
              <div className={styles.bloom} aria-hidden="true" />
              <span className={styles.caret} aria-hidden="true" />
              <input
                ref={input}
                id="ember-concept-prompt"
                aria-label="Describe what you want to create"
                aria-describedby="ember-concept-note"
                value={prompt}
                placeholder="Something extraordinary"
                maxLength={2000}
                autoComplete="off"
                onChange={(event) => setPrompt(event.target.value)}
                required
              />
            </div>
            <button
              className={styles.submit}
              type="submit"
              disabled={!prompt.trim()}
              aria-label="Preview your idea"
            >
              <ArrowRight size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>

          <div className={styles.suggestions} aria-label="Example prompts">
            <span>A spark to start</span>
            {examples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => {
                  setPrompt(example.prompt);
                  input.current?.focus();
                }}
              >
                {example.label}<ArrowRight size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Small beginnings. <em>Endless possibilities.</em></span>
        <span id="ember-concept-note">Interactive concept · No generation runs</span>
      </footer>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="ember-brief-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
          }
        }}
      >
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Close idea preview">
          <X size={19} aria-hidden="true" />
        </button>
        <Asterisk className={styles.briefIcon} size={30} strokeWidth={1.3} aria-hidden="true" />
        <p className={styles.briefLabel}>Your starting point</p>
        <h2 id="ember-brief-title">There’s a spark in that.</h2>
        <blockquote>{brief}</blockquote>
        <p className={styles.briefNote}>This is a preview of the prompt experience. Your idea stays on this page; no app is being generated.</p>
        <button type="button" className={styles.edit} onClick={dismiss}>Keep shaping it <ArrowRight size={17} aria-hidden="true" /></button>
      </dialog>
    </main>
  );
}
