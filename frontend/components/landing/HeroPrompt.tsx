"use client";

import styles from "@/components/landing/hero-prompt.module.css";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/ui/shine-border";
import { MAX_PROJECT_DRAFT_LENGTH, PROJECT_DRAFT_KEY } from "@/lib/projects/draft";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroPrompt() {
    const [prompt, setPrompt] = useState("");
    const [error, setError] = useState("");
    const [opening, setOpening] = useState(false);
    const router = useRouter();

    return (
        <form
            className="hero-prompt-form relative min-w-0 w-full"
            aria-busy={opening}
            onSubmit={(event) => {
                event.preventDefault();
                if (!prompt.trim() || opening) return;
                try {
                    sessionStorage.setItem(PROJECT_DRAFT_KEY, prompt.trim());
                    sessionStorage.removeItem("webbuilder-starter");
                } catch {
                    setError(
                        "Your browser could not save this draft. Allow site storage and try again. Your text is still here.",
                    );
                    return;
                }
                setError("");
                setOpening(true);
                router.push("/chat");
            }}
        >
            <label
                className="block text-[14px] text-secondary-foreground mb-3.5"
                htmlFor="landing-project-brief"
            >
                What would you like to build?
            </label>
            <div
                className={
                    styles.composer +
                    " hero-prompt-composer relative isolate border border-input rounded-[12px] bg-card [box-shadow:0_18px_65px_#ff61290a] [&:focus-within]:outline-2 [&:focus-within]:outline-solid [&:focus-within]:outline-ring [&:focus-within]:outline-offset-1"
                }
            >
                <ShineBorder className={styles.shine + " hero-prompt-shine"} />
                <textarea
                    className="block w-full min-h-28 max-h-65 p-4.5 resize-y field-sizing-content bg-transparent border-0 rounded-[12px] text-foreground text-[16px] leading-[1.5] caret-accent-foreground placeholder:text-muted-foreground placeholder:opacity-100 focus-visible:outline-none max-md:p-5"
                    id="landing-project-brief"
                    name="prompt"
                    value={prompt}
                    onChange={(event) => {
                        setPrompt(event.target.value);
                        setError("");
                    }}
                    placeholder="A portfolio for my cow. Big photos. Make it orange."
                    maxLength={MAX_PROJECT_DRAFT_LENGTH}
                    rows={3}
                    required
                    readOnly={opening}
                    aria-invalid={!!error}
                    aria-describedby={`landing-prompt-note${error ? " landing-prompt-error" : ""}`}
                />
                <div className="hero-prompt-composerFooter flex flex-wrap items-center justify-between gap-3.5 px-4 pb-4 max-md:px-3.5 max-md:pb-3.5 max-md:gap-3">
                    <span
                        className="max-w-[145px] text-[12px] text-muted-foreground leading-[1.5] max-[381px]:max-w-none"
                        id="landing-prompt-note"
                    >
                        Review your brief in the workspace.
                    </span>
                    <Button
                        className="min-h-11 max-w-full px-4 text-[12px] whitespace-normal max-md:px-3 max-[381px]:w-full"
                        type="submit"
                        disabled={!prompt.trim() || opening}
                    >
                        {opening ? "Opening…" : "Open workspace"}
                        <ArrowRight size={17} aria-hidden="true" />
                    </Button>
                </div>
            </div>
            {error && (
                <p
                    className="ember-error mt-3.5 text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
                    id="landing-prompt-error"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </form>
    );
}
