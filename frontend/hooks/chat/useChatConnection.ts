"use client";

import { authService } from "@/services/service.auth";

import { WS_URL } from "@/config/env";
import { getSessionId } from "@/lib/auth/session";
import { consolidateMessages } from "@/lib/chat/messages";
import { handleWebSocketMessage } from "@/socket/handleChatEvent";
import type { Message } from "@/types/chat.type";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Dispatch, SetStateAction } from "react";
type ConnectionOptions = {
    chatId: string;
    setIsBuilding: Dispatch<SetStateAction<boolean>>;
    setRunId: Dispatch<SetStateAction<string | null>>;
    setMessages: Dispatch<SetStateAction<Message[]>>;
    setAppUrl: Dispatch<SetStateAction<string | null>>;
    setError: Dispatch<SetStateAction<string | null>>;
};
export function useChatConnection({
    chatId,
    setIsBuilding,
    setRunId,
    setMessages,
    setAppUrl,
    setError,
}: ConnectionOptions) {
    const router = useRouter();
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const terminalRuns = useRef(new Set<string>());
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
                        await authService.getCurrentUser();
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
    }, [chatId, router, setAppUrl, setError, setIsBuilding, setMessages, setRunId]);

    return { wsConnected, wsRef };
}
