"use client";
import { clearSession } from "@/api/session";

import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi, type UserData } from "@/api";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/ember/Brand";
import { Button } from "@/components/ui/button";
import styles from "@/components/chat/ember-start.module.css";
import { starterBriefs } from "@/lib/starter-briefs";
import {
  MAX_PROJECT_DRAFT_LENGTH,
  PROJECT_DRAFT_KEY,
} from "@/lib/project-draft";
import { ChatNavbar, ChatInputBox } from "@/components/chat";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const initialDraft = useRef<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("auth_token");

    if (initialDraft.current === null) {
      try {
        initialDraft.current = "";
        const explicitStarter = new URLSearchParams(window.location.search).get(
          "starter",
        );
        const draft = sessionStorage.getItem(PROJECT_DRAFT_KEY);
        const requested =
          explicitStarter || sessionStorage.getItem("webbuilder-starter");
        const starter = starterBriefs.find((item) => item.id === requested);
        if (draft?.trim() && !(explicitStarter && starter)) {
          initialDraft.current = draft.slice(0, MAX_PROJECT_DRAFT_LENGTH);
        } else if (starter) {
          initialDraft.current = starter.prompt;
          sessionStorage.removeItem(PROJECT_DRAFT_KEY);
          if (token) sessionStorage.removeItem("webbuilder-starter");
          else sessionStorage.setItem("webbuilder-starter", starter.id);
        }
      } catch {
        /* A starter is optional when session storage is unavailable. */
      }
    }

    if (!token) {
      router.push("/signin");
      return;
    }

    let disposed = false;
    authApi
      .getCurrentUser()
      .then((user) => {
        if (disposed) return;
        localStorage.setItem("user_data", JSON.stringify(user));
        setInput((current) => current || initialDraft.current || "");
        setUserData(user);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!disposed)
          setError("Could not load your account. Refresh to try again.");
      });
    return () => {
      disposed = true;
    };
  }, [router]);

  const handleSignOut = () => {
    clearSession();
    setIsAuthenticated(false);
    setUserData(null);
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isAuthenticated) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await chatApi.createChat(input.trim());
      try {
        sessionStorage.removeItem(PROJECT_DRAFT_KEY);
      } catch {
        // A successfully created chat must still open if storage becomes unavailable.
      }
      router.push(`/chat/${response.chat_id}`);
    } catch (err) {
      console.error("Error creating chat:", err);
      setError("Failed to create chat. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="ember-chat-home flex h-dvh flex-col overflow-hidden [&>.ember-workspace-header]:shrink-0">
      <ChatNavbar
        isAuthenticated={isAuthenticated}
        userData={userData}
        onSignOut={handleSignOut}
      />
      <div className="ember-workspace-shell flex min-h-0 flex-1 overflow-hidden">
        <WorkspaceSidebar current="new" />
        <main id="main-content" className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-background">
          <section className={`${styles.stage} relative isolate flex min-h-full flex-col items-center px-5 pb-6 pt-[clamp(24px,5dvh,64px)] text-center sm:px-10`} aria-labelledby="start-heading">
            <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center">
              <header className="flex w-full flex-col items-center">
                <Brand />
                <h1 id="start-heading" className="mt-8 max-w-4xl text-[clamp(38px,5.5vw,68px)] font-normal leading-[1.08] tracking-[-.055em] text-balance">
                  Talk your next idea <span className="text-accent-foreground">into life.</span>
                </h1>
                <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground sm:max-w-none">A conversation. A little direction. Something that’s yours.</p>
                <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-border/60 bg-secondary/60 p-1.5 pl-5">
                  <span className="text-left text-xs leading-snug text-muted-foreground">From a thought<br />to a first draft.</span>
                  <Button disabled={!isAuthenticated || isLoading} onClick={() => document.getElementById("project-brief")?.focus()} className="min-h-11 rounded-xl px-5">
                    Try an idea <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                </div>
              </header>
              <div className="relative mt-[clamp(40px,calc(20dvh_-_48px),152px)] w-full max-w-2xl">
                <div className={`${styles.workspaceOutline} pointer-events-none absolute -inset-x-4 top-6 h-56 rounded-t-xl border border-border/50 lg:-inset-x-20`} aria-hidden="true">
                  <div className="flex h-8 items-center gap-1.5 border-b border-border/50 px-4">
                    <span className="size-1.5 rounded-full border border-border" />
                    <span className="size-1.5 rounded-full border border-border" />
                    <span className="size-1.5 rounded-full border border-border" />
                    <span className="ml-3 h-5 w-28 rounded-t border border-border/60" />
                  </div>
                </div>
                <ChatInputBox
                  input={input}
                  isLoading={isLoading}
                  disabled={!isAuthenticated}
                  onInputChange={setInput}
                  onSubmit={handleSubmit}
                />
                {error && <p className="relative mt-4 rounded-lg border border-destructive bg-card px-4 py-3 text-left text-sm leading-relaxed text-destructive" role="alert">{error}</p>}
                <p id="project-brief-note" className="relative mt-5 text-xs leading-relaxed text-muted-foreground">Describe your app, then press Enter to start building.</p>
              </div>
              <div className="relative mt-auto pt-10">
                <Link href="/projects" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4">Continue an existing project <ArrowUpRight size={14} aria-hidden="true" /></Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
