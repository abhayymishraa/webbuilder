import axios from "axios";

// API Base URL - change based on environment
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const detail = error.response?.data?.detail;
    if (error.response?.status === 403 && typeof detail === "string" && detail.startsWith("Verify your email")) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      if (window.location.pathname !== "/verify-email") window.location.replace("/verify-email");
    }
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      // Redirect to signin if not already there
      if (!window.location.pathname.includes("/signin")) {
        window.location.href = "/signin";
      }
    }

    // FastAPI validation errors contain objects, not a displayable string.
    let errorMessage = error.message || "Something went wrong. Please try again.";
    if (
      error.config?.url === "/auth/verification/confirm" &&
      error.response?.status === 422
    ) {
      errorMessage = "This verification link is invalid or expired. Request a new one.";
    } else if (typeof detail === "string" && detail.trim()) {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      const messages = detail
        .map((item: unknown) =>
          item && typeof item === "object" && "msg" in item && typeof item.msg === "string"
            ? item.msg.trim()
            : "",
        )
        .filter(Boolean);
      if (messages.length) errorMessage = messages.join(" ");
    }
    return Promise.reject(new Error(errorMessage));
  },
);

export default apiClient;
