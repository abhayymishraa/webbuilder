"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  const [isBuilding, setIsBuilding] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showAllToolsDropdown, setShowAllToolsDropdown] = useState(false);
  const [projectFiles, setProjectFiles] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRuns = useRef(new Set<string>());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Function to fetch project files
  const fetchProjectFiles = async () => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.log("Not in browser environment, skipping file fetch");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No auth token available for fetching files");
        return;
      }

      console.log("📁 Fetching project files for:", chatId);

      const response = await apiClient.get<{
        project_id: string;
        files: string[];
        sandbox_id: string;
        sandbox_active: boolean;
      }>(`/projects/${chatId}/files`);

      console.log(
        "Files fetched successfully:",
        response.data.files?.length || 0,
        "files",
      );
      setProjectFiles(response.data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  };

  // Fetch files when appUrl becomes available
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") {
      console.log("Not in browser, skipping file fetch setup");
      return;
    }

    if (appUrl && chatId) {
      // Delay initial fetch to ensure everything is ready
      const initialTimeout = setTimeout(() => {
        fetchProjectFiles();
      }, 1000);

      // Refetch files every 10 seconds while building
      const interval = setInterval(() => {
        if (isBuilding) {
          fetchProjectFiles();
        }
      }, 10000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUrl, isBuilding, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      if (!token) { router.push('/signin'); return; }
      const ws = new WebSocket(`${WS_URL}/ws/${chatId}`);
      wsRef.current = ws;
      ws.onopen = () => {
        if (disposed) { ws.close(); return; }
        ws.send(JSON.stringify({ type: 'auth', token }));
        attempt = 0;
        setWsConnected(true);
        setError(null);
      };
      ws.onmessage = event => {
        if (disposed || wsRef.current !== ws) return;
        let incoming;
        try { incoming = JSON.parse(event.data); } catch { return; }
        if (incoming.e === 'resync') {
          ws.send(JSON.stringify({ type: 'resync' }));
          return;
        }
        handleWebSocketMessage(event, { setIsBuilding, setRunId,
          setMessages, setAppUrl, setError, consolidateMessages, terminalRuns: terminalRuns.current });
      };
      ws.onclose = event => {
        if (disposed || wsRef.current !== ws) return;
        setWsConnected(false);
        if (event.code === 1008) {
          setIsBuilding(false);
          setError('Session expired or project unavailable. Sign in again.');
          return;
        }
        setError('Connection lost. Reconnecting to check your run; it may still be working.');
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 10000));
      };
      ws.onerror = () => ws.close();
    };
    terminalRuns.current.clear();
    setMessages([]); setAppUrl(null); setRunId(null); setIsBuilding(false);
    connect();
    return () => { disposed = true; clearTimeout(retry); wsRef.current?.close(); wsRef.current = null; };
  }, [chatId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isBuilding) return;
    setIsBuilding(true); setError(null);
    try {
      const { data } = await apiClient.post<{ run_id: string; tokens_remaining: number }>(`/chats/${chatId}/runs`, { prompt });
      setRunId(data.run_id);
      setInput('');
      const updated = { ...userData, tokens_remaining: data.tokens_remaining };
      localStorage.setItem('user_data', JSON.stringify(updated)); setUserData(updated);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'resync' }));
    } catch (err) {
      setIsBuilding(false);
      setError(err instanceof Error ? err.message : 'Request was not accepted');
    }
  };

  const handleCancel = async () => {
    if (!runId) return;
    try {
      await apiClient.post(`/runs/${runId}/cancel`);
      setIsBuilding(false); setRunId(null);
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'resync' }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not stop the run'); }
  };

  return (
    <div
      className="min-h-screen w-full bg-black relative overflow-hidden"
      ref={containerRef}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(226, 232, 240, 0.15), transparent 65%), #000000",
        }}
      />

      <div className="relative z-10 h-screen flex flex-col">
        <ChatIdHeader
          userData={userData}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          onNewChat={() => router.push("/chat")}
          onBack={() => router.push("/chat")}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <div
            className="flex flex-col border-r border-white/5"
            style={{
              width: showPreview ? `${100 - previewWidth}%` : "100%",
              transition: isDragging ? "none" : "width 0.3s ease-out",
            }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-white/60">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading messages...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              ) : null}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                />
              ))}

              <div ref={messagesEndRef} />
            </div>

            <ToolCallsDropdown
              toolCalls={getAllToolCalls(messages)}
              isExpanded={showAllToolsDropdown}
              onToggle={() => setShowAllToolsDropdown(!showAllToolsDropdown)}
            />

            <ChatInput
              input={input}
              wsConnected={wsConnected}
              isBuilding={isBuilding}
              onInputChange={setInput}
              onSubmit={handleSendMessage}
              onCancel={handleCancel}
              canCancel={Boolean(runId)}
            />
          </div>

          {/* Divider */}
          {showPreview && (
            <div
              className="w-1 bg-white/5 hover:bg-white/20 cursor-col-resize transition-colors"
              onMouseDown={() => setIsDragging(true)}
              style={{ userSelect: "none" }}
            />
          )}

          {/* Preview Area */}
          {showPreview && (
            <PreviewPanel
              appUrl={appUrl}
              previewWidth={previewWidth}
              files={projectFiles}
              projectId={chatId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
