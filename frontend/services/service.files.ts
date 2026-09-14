import apiClient from "@/lib/http/client";
import type { SavedFileContent } from "@/types/file.type";
export const fileService = {
    async list(projectId: string) {
        return (
            await apiClient.get<{ files: string[]; revision_id: string | null }>(
                `/projects/${projectId}/files`,
            )
        ).data;
    },
    async read(projectId: string, path: string, revisionQuery: string, signal: AbortSignal) {
        return (
            await apiClient.get<SavedFileContent>(
                `/projects/${projectId}/files/${encodeURIComponent(path)}?${revisionQuery}`,
                { signal },
            )
        ).data;
    },
    async downloadFile(projectId: string, path: string, revisionQuery: string) {
        return (
            await apiClient.get<Blob>(
                `/projects/${projectId}/files/${encodeURIComponent(path)}?raw=true&${revisionQuery}`,
                { responseType: "blob" },
            )
        ).data;
    },
    async downloadProject(projectId: string, revisionQuery: string) {
        return (
            await apiClient.get<Blob>(`/projects/${projectId}/download?${revisionQuery}`, {
                responseType: "blob",
            })
        ).data;
    },
};
