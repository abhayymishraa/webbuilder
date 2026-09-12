"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MAX_PROJECT_DRAFT_LENGTH, PROJECT_DRAFT_KEY } from "@/lib/project-draft";
import styles from "./hero-prompt.module.css";

export function HeroPrompt() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const router = useRouter();

  return (
    <form className={styles.form} aria-busy={opening} onSubmit={(event) => {
      event.preventDefault();
      if (!prompt.trim() || opening) return;
      try {
        sessionStorage.setItem(PROJECT_DRAFT_KEY, prompt.trim());
        sessionStorage.removeItem("webbuilder-starter");
      } catch {
        setError("Your browser could not save this draft. Allow site storage and try again. Your text is still here.");
        return;
      }
      setError("");
      setOpening(true);
      router.push("/chat");
    }}>
      <label htmlFor="landing-project-brief">What would you like to build?</label>
      <div className={styles.composer}>
        <div className={styles.beam} aria-hidden="true" />
        <textarea
          id="landing-project-brief"
          name="prompt"
          value={prompt}
          onChange={(event) => { setPrompt(event.target.value); setError(""); }}
          placeholder="A portfolio for my cow. Big photos. Make it orange."
          maxLength={MAX_PROJECT_DRAFT_LENGTH}
          rows={3}
          required
          readOnly={opening}
          aria-invalid={!!error}
          aria-describedby={`landing-prompt-note${error ? " landing-prompt-error" : ""}`}
        />
        <div className={styles.composerFooter}>
          <span id="landing-prompt-note">Review your brief in the workspace.</span>
          <button type="submit" disabled={!prompt.trim() || opening}>
            {opening ? "Opening…" : "Open workspace"}<ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      {error && <p className="ember-error" id="landing-prompt-error" role="alert">{error}</p>}
    </form>
  );
}
