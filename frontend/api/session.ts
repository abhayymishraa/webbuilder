import type { LoginResponse } from "./types.ts";

export function getSessionId(): string | null {
  if (!localStorage.getItem("auth_token")) return null;
  // Older sessions have only an access token and cannot renew automatically.
  return localStorage.getItem("auth_session_id") || localStorage.getItem("auth_token");
}

export function clearSession() {
  for (const key of ["auth_token", "refresh_token", "auth_session_id", "user_data"]) {
    localStorage.removeItem(key);
  }
}

export function storeTokens(session: LoginResponse) {
  if (!session.access_token || !session.refresh_token) {
    throw new Error("The server returned an incomplete login session.");
  }
  localStorage.setItem("refresh_token", session.refresh_token);
  localStorage.setItem("auth_token", session.access_token);
}

export function saveSession(session: LoginResponse) {
  try {
    storeTokens(session);
    localStorage.setItem("auth_session_id", crypto.randomUUID());
    localStorage.removeItem("user_data");
  } catch (error) {
    clearSession();
    throw error;
  }
}
