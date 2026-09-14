"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Code2, Loader2 } from "lucide-react";
import type { UserData } from "@/api";
import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { WS_URL } from "@/lib/utils";
import apiClient from "@/api/client";
import { getSessionId } from "@/api/session";
import {
  ChatIdHeader,
  MessageBubble,
  PreviewPanel,
  ChatInput,
} from "@/components/chat";
import { consolidateMessages } from "@/lib/chat-utils";
import { handleWebSocketMessage } from "@/lib/websocket-handlers";
import type { Message } from "@/lib/chat-types";
import { usePreviewLifecycle } from "@/lib/use-preview-lifecycle";

export default function ChatIdPage() {
  const params = useParams();
  const chatId = params.id as string;
  return <ChatWorkspace key={chatId} chatId={chatId} />;
}

function ChatWorkspace({ chatId }: { chatId: string }) {
  const router = useRouter();

  const [wsConnected, setWsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [mobilePane, setMobilePane] = useState("chat");
  const [projectFiles, setProjectFiles] = useState<string[]>([]);
  const [previewTab, setPreviewTab] = useState<"preview" | "files">("preview");
  const [desktopPreview, setDesktopPreview] = useState<boolean | null>(null);
  const preview = usePreviewLifecycle({
    projectId: chatId,
    revisionId,
    isBuilding,
    enabled: showPreview && previewTab === "preview" && desktopPreview !== null &&
      (desktopPreview || mobilePane === "preview"),
    onPreviewOpen: setAppUrl,
  });

  useEffect(() => {
    // Match the stylesheet's breakpoint, including CSS-hidden mobile chat.
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktopPreview(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRuns = useRef(new Set<string>());
  const followLatest = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Check authentication and load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const user = localStorage.getItem("user_data");

      if (user) {
        try {
          setUserData(JSON.parse(user));
        } catch (err) {
          console.error("Failed to parse user data:", err);
        }
      }

      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // Saved files stay accessible after the sandbox expires. Poll metadata only during a run.
  useEffect(() => {
    if (!chatId) return;
    let disposed = false;
    let requestNumber = 0;
    const loadFiles = async () => {
      const request = ++requestNumber;
      try {
        const { data } = await apiClient.get<{
          files: string[];
          revision_id: string | null;
        }>(`/projects/${chatId}/files`);
        if (!disposed && request === requestNumber) {
          setProjectFiles(data.files);
          setRevisionId(data.revision_id);
        }
      } catch {
        /* Keep the last readable checkpoint during a temporary outage. */
      }
    };
    void loadFiles();
    const timer = isBuilding
      ? setInterval(() => {
          void loadFiles();
        }, 10000)
      : undefined;
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
    };
  }, [chatId, isBuilding]);

  useEffect(() => {
    if (followLatest.current)
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, mobilePane]);

  // Handle drag resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const chatWidth = (mouseX / rect.width) * 100;
      const newPreviewWidth = 100 - chatWidth;

      if (chatWidth > 20 && chatWidth < 70) {
        setPreviewWidth(newPreviewWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // The connection observes a durable run. Reconnect reloads its authoritative snapshot.
  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const connect = () => {
      if (disposed) return;
      const token = localStorage.getItem("auth_token");
      const sessionId = getSessionId();
      if (!token) {
        router.push("/signin");
        return;
      }
      const ws = new WebSocket(`${WS_URL}/ws/${chatId}`);
      wsRef.current = ws;
      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        ws.send(JSON.stringify({ type: "auth", token }));
        attempt = 0;
        setWsConnected(true);
        setError(null);
      };
      ws.onmessage = (event) => {
        if (disposed || wsRef.current !== ws) return;
        let incoming;
        try {
          incoming = JSON.parse(event.data);
        } catch {
          return;
        }
        if (incoming.e === "resync") {
          ws.send(JSON.stringify({ type: "resync" }));
          return;
        }
        handleWebSocketMessage(event, {
          setIsBuilding,
          setRunId,
          setMessages,
          setAppUrl,
          setError,
          consolidateMessages,
          terminalRuns: terminalRuns.current,
        });
      };
      ws.onclose = async (event) => {
        if (disposed || wsRef.current !== ws) return;
        setWsConnected(false);
        if (event.code === 1008) {
          // HTTP can renew an expired token; a socket policy close alone cannot
          // distinguish expiry from a missing project or denied permission.
          try {
            await apiClient.get("/auth/me");
            if (disposed || wsRef.current !== ws) return;
            if (
              getSessionId() === sessionId &&
              localStorage.getItem("auth_token") !== token
            ) {
              connect();
              return;
            }
          } catch {
            if (disposed || wsRef.current !== ws) return;
          }
          setIsBuilding(false);
          setError(
            "Could not reconnect. Check your connection and project access, then reload.",
          );
          return;
        }
        setError(
          "Connection lost. Reconnecting to check your run; it may still be working.",
        );
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 10000));
      };
      ws.onerror = () => ws.close();
    };
    terminalRuns.current.clear();
    setMessages([]);
    setAppUrl(null);
    setRunId(null);
    setIsBuilding(false);
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [chatId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isBuilding) return;
    setIsBuilding(true);
    setError(null);
    followLatest.current = true;
    try {
      const { data } = await apiClient.post<{
        run_id: string;
        tokens_remaining: number;
      }>(`/chats/${chatId}/runs`, { prompt });
      setRunId(data.run_id);
      setInput("");
      if (userData) {
        const updated = {
          ...userData,
          tokens_remaining: data.tokens_remaining,
        };
        localStorage.setItem("user_data", JSON.stringify(updated));
        setUserData(updated);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN)
        wsRef.current.send(JSON.stringify({ type: "resync" }));
    } catch (err) {
      setIsBuilding(false);
      setError(err instanceof Error ? err.message : "Request was not accepted");
    }
  };

  const handleCancel = async () => {
    if (!runId) return;
    try {
      await apiClient.post(`/runs/${runId}/cancel`);
      setIsBuilding(false);
      setRunId(null);
      if (wsRef.current?.readyState === WebSocket.OPEN)
        wsRef.current.send(JSON.stringify({ type: "resync" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop the run");
    }
  };

  // Frame and composer layout adapted from Beautiful UI ChatComposer (MIT).
  // Keep transport, durable run ownership and message consolidation in this page.
  return (
    <div className="ember-builder h-dvh min-h-125 flex flex-col overflow-hidden bg-background max-md:min-h-112.5 max-md:[&_.ember-workspace-header>.ember-row]:gap-0.5 max-md:[&_.ember-workspace-header_.ember-icon]:w-7.5 transcript-workspace [&.ember-builder]:min-h-0">
      <ChatIdHeader
        userData={userData}
        showPreview={showPreview}
        onTogglePreview={() => {
          setShowPreview(!showPreview);
          setMobilePane("chat");
        }}
        onNewChat={() => router.push("/chat")}
        onBack={() => router.push("/projects")}
      />
      <div
        className="ember-mobile-tabs hidden max-md:flex max-md:gap-1.5 max-md:py-[7px] max-md:px-[15px] max-md:border-b max-md:border-b-border max-md:[&>button]:flex-1"
        role="group"
        aria-label="Workspace view"
      >
        <Button
          variant="tab"
          aria-pressed={mobilePane === "chat"}
          onClick={() => setMobilePane("chat")}
        >
          Chat
        </Button>
        <Button
          variant="tab"
          aria-pressed={mobilePane === "preview"}
          onClick={() => {
            setShowPreview(true);
            setMobilePane("preview");
          }}
        >
          Workspace
        </Button>
      </div>
      <div className="ember-builder-shell flex flex-1 min-h-0 max-[1101px]:[&>.ember-workspace-sidebar]:hidden">
        <WorkspaceSidebar current="builder" />
        <main
          ref={containerRef}
          className="ember-builder-body flex-1 min-h-0 flex overflow-hidden max-md:[&[data-mobile-pane=chat]>.ember-preview]:hidden max-md:[&[data-mobile-pane=preview]>.ember-conversation]:hidden max-md:[&>.ember-preview]:w-full! max-md:[&>.ember-conversation]:w-full!"
          data-mobile-pane={mobilePane}
          id="main-content"
        >
          <section
            className="ember-conversation flex flex-col min-w-0 min-h-0 bg-card"
            aria-label="Project conversation"
            style={{ width: showPreview ? `${100 - previewWidth}%` : "100%" }}
          >
            <div className="ember-conversation-toolbar min-h-12 flex items-center justify-between gap-2.5 py-1.5 px-3.5 border-b border-b-border [&_.ember-row]:gap-[5px] [&_button]:text-[12px]">
              <span className="ember-helper text-[12px] leading-[1.6] text-muted-foreground">
                Conversation
              </span>
            </div>
            <div
              className="ember-message-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain py-[25px] px-6 flex flex-col gap-[23px] max-md:py-5 max-md:px-4"
              onScroll={(event) => {
                const element = event.currentTarget;
                followLatest.current =
                  element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <
                  100;
              }}
            >
              {isLoading && (
                <div
                  className="ember-row flex items-center gap-3.5 ember-helper text-[12px] leading-[1.6] text-muted-foreground"
                  role="status"
                >
                  <Loader2 size={18} className="animate-spin" />
                  Loading messages…
                </div>
              )}
              {error && (
                <p
                  className="ember-error text-destructive border border-destructive bg-card py-3 px-[15px] rounded-[8px] text-[13px] leading-[1.5]"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {!messages.length && !isLoading && (
                <div className="ember-chat-intro pt-3 px-0 pb-5 [&>svg]:text-accent-foreground [&>svg]:mb-4.5 [&_h2]:text-[23px] [&_h2]:leading-[1.2] [&_h2]:tracking-[-0.7px] [&_h2]:font-medium [&_p]:text-muted-foreground [&_p]:text-[13px] [&_p]:leading-[1.7] [&_p]:mt-2.5">
                  <Code2 size={26} />
                  <h2>Let’s make something useful.</h2>
                  <p>Your conversation and build updates will appear here.</p>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  connected={wsConnected}
                />
              ))}
              {isBuilding &&
                !messages.some((message) => message.id === `run:${runId}`) && (
                  <div
                    className="ember-row flex items-center gap-3.5 ember-helper text-[12px] leading-[1.6] text-muted-foreground"
                    role="status"
                  >
                    <Loader2 size={15} className="animate-spin" />
                    Working on your app. You can stop this run below.
                  </div>
                )}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput
              files={projectFiles}
              input={input}
              wsConnected={wsConnected}
              isBuilding={isBuilding}
              onInputChange={setInput}
              onSubmit={handleSendMessage}
              onCancel={handleCancel}
              canCancel={Boolean(runId)}
            />
          </section>
          {showPreview && (
            <>
              <div
                className="ember-resizer w-[5px] shrink-0 bg-border cursor-col-resize touch-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-[-1px] hover:bg-ring max-md:hidden"
                role="separator"
                aria-label="Resize conversation and preview"
                aria-orientation="vertical"
                aria-valuenow={100 - previewWidth}
                aria-valuemin={20}
                aria-valuemax={70}
                tabIndex={0}
                onMouseDown={() => setIsDragging(true)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    setPreviewWidth((width) =>
                      Math.max(
                        30,
                        Math.min(
                          80,
                          width + (event.key === "ArrowLeft" ? 5 : -5),
                        ),
                      ),
                    );
                  }
                }}
              />
              <PreviewPanel
                appUrl={appUrl}
                previewWidth={previewWidth}
                files={projectFiles}
                revisionId={revisionId}
                isBuilding={isBuilding}
                projectId={chatId}
                activeTab={previewTab}
                onTabChange={setPreviewTab}
                phase={preview.phase}
                previewError={preview.error}
                onRetry={preview.retry}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
