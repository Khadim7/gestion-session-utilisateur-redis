export interface Preferences {
  theme: "clair" | "sombre";
  langue: "fr" | "en";
}

export interface SessionInfo {
  sessionId: string;
  username: string;
  createdAt: number;
  lastRefreshedAt: number;
  preferences: Preferences;
  ttlSeconds: number;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const sessionId = localStorage.getItem("sessionId");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "x-session-id": sessionId } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Erreur inconnue de l'API.");
  }

  return data as T;
}

export const api = {
  login: (username: string) =>
    request<{ sessionId: string; ttlSeconds: number; message: string }>(
      "/api/session/login",
      { method: "POST", body: JSON.stringify({ username }) }
    ),

  me: () => request<SessionInfo>("/api/session/me"),

  refresh: () =>
    request<{ message: string; ttlSeconds: number }>("/api/session/refresh", {
      method: "POST",
    }),

  updatePreferences: (preferences: Partial<Preferences>) =>
    request<{ message: string; preferences: Preferences }>(
      "/api/session/preferences",
      { method: "PUT", body: JSON.stringify(preferences) }
    ),

  logout: () =>
    request<{ message: string }>("/api/session/logout", { method: "DELETE" }),

  listSessions: () =>
    request<{ count: number; sessions: SessionInfo[] }>("/api/sessions"),
};
