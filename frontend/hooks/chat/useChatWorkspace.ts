"use client";

import { runService } from "@/services/service.runs";

import { usePreviewLifecycle } from "@/hooks/preview/usePreviewLifecycle";
import type { UserData } from "@/types/auth.type";
import type { Message } from "@/types/chat.type";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useProjectFiles } from "@/hooks/files/useProjectFiles";
import { useChatConnection } from "./useChatConnection";
import { useWorkspaceLayout } from "./useWorkspaceLayout";
export function useChatWorkspace(chatId: string) {
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [appUrl, setAppUrl] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const { projectFiles, revisionId } = useProjectFiles(chatId, isBuilding);
    const [runId, setRunId] = useState<string | null>(null);
    const {
        previewWidth,
        setPreviewWidth,
        setIsDragging,
        showPreview,
        setShowPreview,
        mobilePane,
        setMobilePane,
        previewTab,
        setPreviewTab,
        workspaceVisible,
        containerRef,
    } = useWorkspaceLayout();
    const [userData, setUserData] = useState<UserData | null>(null);
    const preview = usePreviewLifecycle({
        projectId: chatId,
        revisionId,
        isBuilding,
        enabled: workspaceVisible && previewTab === "preview",
        onPreviewOpen: setAppUrl,
    });

    const followLatest = useRef(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (followLatest.current) messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages, mobilePane]);

    const { wsConnected, wsRef } = useChatConnection({
        chatId,
        setIsBuilding,
        setRunId,
        setMessages,
        setAppUrl,
        setError,
    });

    function handleConversationScroll(event: React.UIEvent<HTMLDivElement>) {
        const element = event.currentTarget;
        followLatest.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const prompt = input.trim();
        if (!prompt || isBuilding) return;
        setIsBuilding(true);
        setError(null);
        followLatest.current = true;
        try {
            const data = await runService.start(chatId, prompt);
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
            await runService.cancel(runId);
            setIsBuilding(false);
            setRunId(null);
            if (wsRef.current?.readyState === WebSocket.OPEN)
                wsRef.current.send(JSON.stringify({ type: "resync" }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not stop the run");
        }
    };

    return {
        router,
        wsConnected,
        messages,
        error,
        input,
        setInput,
        isLoading,
        appUrl,
        revisionId,
        isBuilding,
        runId,
        previewWidth,
        setPreviewWidth,
        setIsDragging,
        showPreview,
        setShowPreview,
        userData,
        mobilePane,
        setMobilePane,
        projectFiles,
        previewTab,
        setPreviewTab,
        workspaceVisible,
        preview,
        handleConversationScroll,
        messagesEndRef,
        containerRef,
        handleSendMessage,
        handleCancel,
    };
}
