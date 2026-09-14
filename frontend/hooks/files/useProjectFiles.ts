"use client";

import { fileService } from "@/services/service.files";

import { useEffect, useState } from "react";

export function useProjectFiles(chatId: string, isBuilding: boolean) {
    const [projectFiles, setProjectFiles] = useState<string[]>([]);
    const [revisionId, setRevisionId] = useState<string | null>(null);
    // Saved files stay accessible after the sandbox expires. Poll metadata only during a run.
    useEffect(() => {
        if (!chatId) return;
        let disposed = false;
        let requestNumber = 0;
        const loadFiles = async () => {
            const request = ++requestNumber;
            try {
                const data = await fileService.list(chatId);
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

    return { projectFiles, revisionId };
}
