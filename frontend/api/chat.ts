import { apiClient } from "./client";
import { ChatResponse, Project } from "./types";

type ProjectDeletion = {
  deleted: true;
  storage_cleanup: "completed" | "queued";
  sandbox_cleanup: "completed" | "queued";
};

/**
 * Chat API Service
 */
export const chatApi = {
  deleteProject: async (id: string): Promise<ProjectDeletion> => {
    const response = await apiClient.delete<ProjectDeletion>(
      `/projects/${encodeURIComponent(id)}`,
    );
    return response.data;
  },
  /**
   * Create or start a new chat
   */
  createChat: async (prompt: string): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/chat", { prompt });
    return response.data;
  },

  /**
   * Get list of user's projects
   */
  listProjects: async (): Promise<{ projects: Project[] }> => {
    const response = await apiClient.get<{ projects: Project[] }>("projects");
    return response.data;
  },
};
