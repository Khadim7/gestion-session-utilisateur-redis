import { useState } from "react";
import { api } from "../api";

interface Props {
  onLoggedIn: (sessionId: string) => void;
}

export default function LoginForm({ onLoggedIn }: Props) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Merci de saisir un nom d'utilisateur.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(username);
      localStorage.setItem("sessionId", res.sessionId);
      onLoggedIn(res.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Ouvrir une session</h1>
      <p className="muted">
        Chaque connexion crée une entrée en mémoire dans Redis, avec une
        durée de vie limitée (TTL).
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Nom d'utilisateur</label>
        <input
          id="username"
          type="text"
          placeholder="ex: bonjour"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
