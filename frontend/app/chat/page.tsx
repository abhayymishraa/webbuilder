"use client";
import { clearSession } from "@/api/session";

import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi, chatApi, type UserData } from "@/api";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2 } from "lucide-react";
import { starterBriefs } from "@/lib/starter-briefs";
import { MAX_PROJECT_DRAFT_LENGTH, PROJECT_DRAFT_KEY } from "@/lib/project-draft";
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
        const explicitStarter = new URLSearchParams(window.location.search).get("starter");
        const draft = sessionStorage.getItem(PROJECT_DRAFT_KEY);
        const requested = explicitStarter || sessionStorage.getItem("webbuilder-starter");
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
    authApi.getCurrentUser().then((user) => {
      if (disposed) return;
      localStorage.setItem("user_data", JSON.stringify(user));
      setInput((current) => current || initialDraft.current || "");
      setUserData(user);
      setIsAuthenticated(true);
    }).catch(() => {
      if (!disposed) setError("Could not load your account. Refresh to try again.");
    });
    return () => { disposed = true; };

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
    <div className="ember-chat-home">
      <ChatNavbar
        isAuthenticated={isAuthenticated}
        userData={userData}
        onSignOut={handleSignOut}
      />
      <div className="ember-workspace-shell">
        <WorkspaceSidebar current="new" />
        <main className="ember-workspace" id="main-content">
          <div className="ember-page-title ember-workspace-intro">
            <div>
              <p className="ember-eyebrow">A fresh start</p>
              <h1>
                What would you
                <br />
                like to make?
              </h1>
              <p>Tell us who it is for and what they should be able to do.</p>
            </div>
          </div>
          <div className="ember-brief">
            <ChatInputBox
              input={input}
              isLoading={isLoading || !isAuthenticated}
              onInputChange={setInput}
              onSubmit={handleSubmit}
            />
            {error && (
              <p className="ember-error mt-4" role="alert">
                {error}
              </p>
            )}
            <div className="ember-starter-list" aria-label="Example briefs">
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
            <div className="ember-workspace-note">
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
