import apiClient from "@/lib/http/client";
import type { PreviewStatus } from "@/types/preview.type";
export const previewService = {
    async status(projectId: string, signal: AbortSignal, timeout: number) {
        return (
            await apiClient.get<PreviewStatus>(`/projects/${projectId}/preview`, {
                signal,
                timeout,
            })
        ).data;
    },
    async open(projectId: string, signal: AbortSignal, timeout: number) {
        return (
            await apiClient.post<{ url: string; revision_id: string }>(
                `/projects/${projectId}/preview`,
                undefined,
                { signal, timeout },
            )
        ).data;
    },
};
