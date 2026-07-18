import { useCallback, useEffect, useRef, useState } from "react";
import { api, SessionInfo } from "../api";
import PreferencesForm from "./PreferencesForm";
import { t } from "../i18n";

interface Props {
  onLoggedOut: () => void;
  onThemeChange: (theme: "clair" | "sombre") => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Dashboard({ onLoggedOut, onThemeChange }: Props) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [ttl, setTtl] = useState(0);
  const [allSessions, setAllSessions] = useState<SessionInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const maxTtlRef = useRef(1);

  const fetchSession = useCallback(async () => {
    try {
      const data = await api.me();
      setSession(data);
      setTtl(data.ttlSeconds);
      if (data.ttlSeconds > maxTtlRef.current) maxTtlRef.current = data.ttlSeconds;
      setError(null);
    } catch (err) {
      setError("Session expirée. Merci de vous reconnecter.");
      localStorage.removeItem("sessionId");
      setTimeout(onLoggedOut, 1500);
    }
  }, [onLoggedOut]);

  const fetchAllSessions = useCallback(async () => {
    try {
      const data = await api.listSessions();
      setAllSessions(data.sessions);
    } catch {
      /* silencieux : n'affecte pas la session courante */
    }
  }, []);

  // Chargement initial + synchronisation périodique avec le serveur
  useEffect(() => {
    fetchSession();
    fetchAllSessions();
    const syncInterval = setInterval(() => {
      fetchSession();
      fetchAllSessions();
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [fetchSession, fetchAllSessions]);

  // Décompte local seconde par seconde entre deux synchronisations serveur
  useEffect(() => {
    const tick = setInterval(() => {
      setTtl((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Répercute le thème choisi dans les préférences sur l'ensemble de l'application
  useEffect(() => {
    if (session) onThemeChange(session.preferences.theme);
  }, [session?.preferences.theme, onThemeChange]);

  async function handleRefresh() {
    await api.refresh();
    maxTtlRef.current = Math.max(maxTtlRef.current, 900);
    fetchSession();
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem("sessionId");
      onLoggedOut();
    }
  }

  const strings = t(session?.preferences.langue);

  if (error) {
    return <div className="auth-card error-card">{error}</div>;
  }

  if (!session) {
    return <div className="auth-card">{strings.loading}</div>;
  }

  const ratio = Math.max(0, Math.min(1, ttl / maxTtlRef.current));
  const decayLevel = ratio > 0.5 ? "healthy" : ratio > 0.2 ? "warning" : "critical";

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>
          {strings.greeting}, {session.username}
        </h1>
        <button className="ghost" onClick={handleLogout}>
          {strings.logout}
        </button>
      </header>

      <section className="panel">
        <h3>{strings.ttlTitle}</h3>
        <div className={`decay-bar decay-${decayLevel}`}>
          <div className="decay-fill" style={{ width: `${ratio * 100}%` }} />
        </div>
        <div className="decay-meta">
          <span className="decay-timer">{formatTime(ttl)}</span>
          <button onClick={handleRefresh}>{strings.extend}</button>
        </div>
      </section>

      <PreferencesForm
        preferences={session.preferences}
        lang={session.preferences.langue}
        onUpdated={(preferences) => setSession({ ...session, preferences })}
      />

      <section className="panel">
        <h3>{strings.activeSessions}</h3>
        <p className="muted small">{strings.activeSessionsDesc}</p>
        <table className="session-table">
          <thead>
            <tr>
              <th>{strings.user}</th>
              <th>{strings.sessionIdCol}</th>
              <th>{strings.ttlRemaining}</th>
            </tr>
          </thead>
          <tbody>
            {allSessions.map((s) => (
              <tr key={s.sessionId} className={s.sessionId === session.sessionId ? "current" : ""}>
                <td>{s.username}</td>
                <td className="mono">{s.sessionId.slice(0, 8)}...</td>
                <td>{formatTime(s.ttlSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allSessions.length === 0 && <p className="muted small">{strings.noSessions}</p>}
      </section>
    </div>
  );
}
