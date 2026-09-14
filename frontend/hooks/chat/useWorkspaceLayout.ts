"use client";

import { useEffect, useRef, useState } from "react";

export function useWorkspaceLayout() {
    const containerRef = useRef<HTMLElement>(null);
    const [previewWidth, setPreviewWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [mobilePane, setMobilePane] = useState("chat");
    const [previewTab, setPreviewTab] = useState<"preview" | "files">("preview");
    const [desktopPreview, setDesktopPreview] = useState<boolean | null>(null);
    const workspaceVisible =
        showPreview && desktopPreview !== null && (desktopPreview || mobilePane === "preview");
    useEffect(() => {
        // Match the stylesheet's breakpoint, including CSS-hidden mobile chat.
        const media = window.matchMedia("(min-width: 768px)");
        const update = () => setDesktopPreview(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

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

    return {
        previewWidth,
        setPreviewWidth,
        isDragging,
        setIsDragging,
        showPreview,
        setShowPreview,
        mobilePane,
        setMobilePane,
        previewTab,
        setPreviewTab,
        workspaceVisible,
        containerRef,
    };
}
