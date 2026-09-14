import apiClient from "@/lib/http/client";
export const runService = {
    async start(chatId: string, prompt: string) {
        return (
            await apiClient.post<{ run_id: string; tokens_remaining: number }>(
                `/chats/${chatId}/runs`,
                { prompt },
            )
        ).data;
    },
    async cancel(runId: string) {
        await apiClient.post(`/runs/${runId}/cancel`);
    },
};
