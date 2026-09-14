"use client";
import { clearSession } from "@/api/session";

import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi, type UserData } from "@/api";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2 } from "lucide-react";
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
    if (!input.trim() || isLoading) return;

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
    <div className="ember-chat-home h-dvh flex flex-col overflow-hidden [&>.ember-workspace-header]:flex-none [&_.ember-workspace-shell]:flex-1 [&_.ember-workspace-shell]:min-h-0 [&_.ember-workspace-shell]:overflow-hidden [&_.ember-workspace]:h-full [&_.ember-workspace]:my-0 [&_.ember-workspace]:min-w-0 [&_.ember-workspace]:min-h-0 [&_.ember-workspace]:overflow-y-auto [&_.ember-workspace]:py-[clamp(20px,_5dvh,_48px)] [&_.ember-workspace]:px-[clamp(20px,_4vw,_48px)] [&_.ember-workspace-intro]:mb-[clamp(16px,_3dvh,_28px)] [&_.ember-page-title_h1]:text-[clamp(30px,_5dvh,_48px)] [&_.ember-page-title_h1]:leading-[1.1] [&_.ember-composer_textarea]:resize-none [&_.ember-composer_textarea]:max-h-35 [&_.ember-composer_textarea]:text-[16px] [&_.ember-starter-list]:mt-5 [&_.ember-workspace-note]:mt-6 [&_.ember-workspace-note]:pt-4.5 max-md:[&_.ember-starter-list]:grid-cols-3 max-md:[&_.ember-starter-list]:gap-2 max-md:[&_.ember-starter-list_button]:flex max-md:[&_.ember-starter-list_button]:flex-col max-md:[&_.ember-starter-list_button]:items-start max-md:[&_.ember-starter-list_button]:py-3 max-md:[&_.ember-starter-list_button]:px-2 max-md:[&_.ember-starter-list_button]:gap-1.5 max-md:[&_.ember-starter-list_button_span]:hidden max-md:[&_.ember-starter-list_strong]:text-[12px] max-md:[&_.ember-starter-list_strong]:wrap-normal max-md:[&_.ember-workspace-note]:flex-wrap max-md:[&_.ember-workspace-note]:gap-2 max-md:[&_.ember-workspace-note]:text-[12px] [@media(height<=700px)]:[&_.ember-workspace]:py-4 [@media(height<=700px)]:[&_.ember-starter-list]:mt-3.5 [@media(height<=700px)]:[&_.ember-workspace-intro]:mb-[15px] [@media(height<=700px)]:[&_.ember-starter-list_button_span]:hidden [@media(height<=700px)]:[&_.ember-workspace-note]:hidden [@media(height<=700px)]:[&_.ember-starter-list_button]:p-3 max-md:[&_.ember-composer_textarea]:h-[clamp(75px,_12dvh,_110px)]">
      <ChatNavbar
        isAuthenticated={isAuthenticated}
        userData={userData}
        onSignOut={handleSignOut}
      />
      <div className="ember-workspace-shell flex min-h-[calc(100dvh_-_76px)] [&>.ember-workspace]:flex-1 [&>.ember-workspace]:min-w-0 [&>.ember-workspace]:w-full [&>.ember-workspace]:mx-auto max-md:min-h-[calc(100dvh_-_70px)]">
        <WorkspaceSidebar current="new" />
        <main
          className="ember-workspace max-w-295 m-auto pt-18 px-10 pb-25 max-md:pt-[45px] max-md:px-5.5 max-md:pb-[65px]"
          id="main-content"
        >
          <div className="ember-page-title flex items-center justify-between gap-7.5 [&_h1]:text-[clamp(32px,_4vw,_46px)] [&_h1]:leading-[1.08] [&_h1]:tracking-[-1.8px] [&_h1]:font-medium [&_p:not(.ember-eyebrow)]:text-[14px] [&_p:not(.ember-eyebrow)]:leading-[1.7] [&_p:not(.ember-eyebrow)]:text-muted-foreground [&_p:not(.ember-eyebrow)]:mt-4 max-md:items-start max-md:flex-col max-md:gap-5 ember-workspace-intro max-w-175 mb-10">
            <div>
              <p className="ember-eyebrow uppercase tracking-[0.12em] text-[10px] font-medium text-accent-foreground mb-5.5">
                A fresh start
              </p>
              <h1>
                What would you
                <br />
                like to make?
              </h1>
              <p>Tell us who it is for and what they should be able to do.</p>
            </div>
          </div>
          <div className="ember-brief max-w-187.5">
            <ChatInputBox
              input={input}
              isLoading={isLoading || !isAuthenticated}
              onInputChange={setInput}
              onSubmit={handleSubmit}
            />
            {error && (
              <p
                className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5] mt-4"
                role="alert"
              >
                {error}
              </p>
            )}
            <div
              className="ember-starter-list grid grid-cols-3 gap-3.5 mt-8 [&>button]:p-4.5 [&>button]:border [&>button]:border-border [&>button]:bg-card [&>button]:text-left [&>button]:rounded-[10px] [&>button]:flex [&>button]:flex-col [&>button]:items-start [&>button]:gap-3 [&_strong]:text-[14px] [&_strong]:font-medium [&_span]:text-[12px] [&_span]:leading-[1.5] [&_span]:text-muted-foreground [&_svg]:text-accent-foreground pointer-fine:[&>button:hover]:border-input max-md:grid-cols-[1fr] max-md:[&>button]:grid max-md:[&>button]:grid-cols-[22px_1fr] max-md:[&>button]:gap-y-1.5 max-md:[&>button]:gap-x-3 max-md:[&>button>span]:col-start-2"
              aria-label="Example briefs"
            >
              {starterBriefs.map((starter) => (
                <button
                  type="button"
                  key={starter.id}
                  disabled={isLoading}
                  onClick={() => {
                    setInput(starter.prompt);
                    document.getElementById("project-brief")?.focus();
                  }}
                >
                  <Code2 size={19} />
                  <strong>{starter.title}</strong>
                  <span>{starter.description}</span>
                </button>
              ))}
            </div>
            <div className="ember-workspace-note flex items-center gap-[15px] mt-12 border-t border-t-border pt-[25px] text-muted-foreground text-[13px] [&_a]:ml-auto [&_a]:text-accent-foreground max-md:items-start max-md:flex-wrap max-md:[&_a]:ml-0">
              <BookOpen size={19} />
              <span>Start small. Make the next change together.</span>
              <Link href="/projects">
                Your projects <ArrowUpRight size={14} className="inline" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
