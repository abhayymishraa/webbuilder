"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Code2, Loader2, Plus } from "lucide-react";
import type { UserData } from "@/api";
import { WorkspaceSidebar } from "@/components/ember/WorkspaceSidebar";
import { WS_URL } from "@/lib/utils";
import apiClient from "@/api/client";
import {
  ChatIdHeader,
  MessageBubble,
  ToolCallsDropdown,
  PreviewPanel,
  ChatInput,
} from "@/components/chat";
import { consolidateMessages, getAllToolCalls } from "@/lib/chat-utils";
import { handleWebSocketMessage } from "@/lib/websocket-handlers";
import type { Message } from "@/lib/chat-types";

export default function ChatIdPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

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
  const [showAllToolsDropdown, setShowAllToolsDropdown] = useState(true);
  const [activeTab, setActiveTab] = useState("conversation");
  const [mobilePane, setMobilePane] = useState("chat");
  const [projectFiles, setProjectFiles] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRuns = useRef(new Set<string>());
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
        const { data } = await apiClient.get<{ files: string[]; revision_id: string | null }>(`/projects/${chatId}/files`);
        if (!disposed && request === requestNumber) {
          setProjectFiles(data.files);
          setRevisionId(data.revision_id);
        }
      } catch { /* Keep the last readable checkpoint during a temporary outage. */ }
    };
    void loadFiles();
    const timer = isBuilding ? setInterval(() => { void loadFiles(); }, 10000) : undefined;
    return () => { disposed = true; if (timer) clearInterval(timer); };
  }, [chatId, isBuilding]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, activeTab, mobilePane]);

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
      ws.onclose = (event) => {
        if (disposed || wsRef.current !== ws) return;
        setWsConnected(false);
        if (event.code === 1008) {
          setIsBuilding(false);
          setError("Session expired or project unavailable. Sign in again.");
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
    setActiveTab("conversation");
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
    <div className="ember-builder">
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
        className="ember-mobile-tabs"
        role="group"
        aria-label="Workspace view"
      >
        <button
          className="ember-tab"
          aria-pressed={mobilePane === "chat"}
          onClick={() => setMobilePane("chat")}
        >
          Chat
        </button>
        <button
          className="ember-tab"
          aria-pressed={mobilePane === "preview"}
          onClick={() => {
            setShowPreview(true);
            setMobilePane("preview");
          }}
        >
          Workspace
        </button>
      </div>
      <div className="ember-builder-shell">
        <WorkspaceSidebar current="builder" />
        <main
          ref={containerRef}
          className="ember-builder-body"
          data-mobile-pane={mobilePane}
          id="main-content"
        >
          <section
            className="ember-conversation"
            aria-label="Project conversation"
            style={{ width: showPreview ? `${100 - previewWidth}%` : "100%" }}
          >
            <div className="ember-conversation-toolbar">
              <div
                className="ember-row"
                role="group"
                aria-label="Conversation views"
              >
                <button
                  className="ember-tab"
                  aria-pressed={activeTab === "conversation"}
                  onClick={() => setActiveTab("conversation")}
                >
                  Conversation
                </button>
                <button
                  className="ember-tab"
                  aria-pressed={activeTab === "activity"}
                  onClick={() => setActiveTab("activity")}
                >
                  Activity
                  {getAllToolCalls(messages).length > 0 &&
                    ` (${getAllToolCalls(messages).length})`}
                </button>
              </div>
              <button
                className="ember-icon"
                onClick={() => router.push("/chat")}
                aria-label="New project"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="ember-message-scroll">
              {isLoading && (
                <div className="ember-row ember-helper" role="status">
                  <Loader2 size={18} className="animate-spin" />
                  Loading messages…
                </div>
              )}
              {error && (
                <p className="ember-error" role="alert">
                  {error}
                </p>
              )}
              {activeTab === "conversation" ? (
                <>
                  {!messages.length && !isLoading && (
                    <div className="ember-chat-intro">
                      <Code2 size={26} />
                      <h2>Let’s make something useful.</h2>
                      <p>
                        Your conversation and build updates will appear here.
                      </p>
                    </div>
                  )}
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isBuilding && (
                    <div className="ember-row ember-helper" role="status">
                      <Loader2 size={15} className="animate-spin" />
                      Working on your app. You can stop this run below.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <>
                  <div className="ember-chat-intro">
                    <h2>What’s happening.</h2>
                    <p>
                      {isBuilding
                        ? "A run is in progress. Activity updates as it works."
                        : "Inspect the recorded tool activity for this project."}
                    </p>
                  </div>
                  {getAllToolCalls(messages).length ? (
                    <ToolCallsDropdown
                      toolCalls={getAllToolCalls(messages)}
                      isExpanded={showAllToolsDropdown}
                      onToggle={() =>
                        setShowAllToolsDropdown(!showAllToolsDropdown)
                      }
                    />
                  ) : (
                    <p className="ember-helper">
                      No tool activity recorded yet.
                    </p>
                  )}
                </>
              )}
            </div>
            <ChatInput
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
                className="ember-resizer"
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
                onPreviewOpen={setAppUrl}
                projectId={chatId}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
