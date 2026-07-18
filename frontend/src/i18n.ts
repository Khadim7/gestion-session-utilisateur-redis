export type Lang = "fr" | "en";

export const translations = {
  fr: {
    greeting: "Bonjour",
    logout: "Se déconnecter",
    ttlTitle: "Durée de vie (TTL)",
    extend: "Prolonger la session",
    activeSessions: "Sessions actives",
    activeSessionsDesc:
      "Vue en temps réel de toutes les sessions présentes dans Redis (rafraîchie toutes les 5 secondes).",
    user: "Utilisateur",
    sessionIdCol: "ID de session",
    ttlRemaining: "TTL restant",
    noSessions: "Aucune session active.",
    loading: "Chargement de la session...",
    expired: "Session expirée. Merci de vous reconnecter.",
    preferencesTitle: "Préférences",
    preferencesDesc: "Modifie la valeur stockée dans Redis sans réinitialiser le TTL.",
    theme: "Thème",
    language: "Langue",
    saved: "enregistré",
    themeLight: "clair",
    themeDark: "sombre",
  },
  en: {
    greeting: "Hello",
    logout: "Log out",
    ttlTitle: "Time to live (TTL)",
    extend: "Extend session",
    activeSessions: "Active sessions",
    activeSessionsDesc:
      "Real-time view of all sessions currently stored in Redis (refreshed every 5 seconds).",
    user: "User",
    sessionIdCol: "Session ID",
    ttlRemaining: "TTL remaining",
    noSessions: "No active session.",
    loading: "Loading session...",
    expired: "Session expired. Please log in again.",
    preferencesTitle: "Preferences",
    preferencesDesc: "Updates the value stored in Redis without resetting the TTL.",
    theme: "Theme",
    language: "Language",
    saved: "saved",
    themeLight: "light",
    themeDark: "dark",
  },
} as const;

export function t(lang: Lang | undefined) {
  return translations[lang ?? "fr"];
}
