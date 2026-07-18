import { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const [theme, setTheme] = useState<"clair" | "sombre">("sombre");

  // Le thème est posé sur <html>, l'ancêtre commun à <body> et à toute
  // l'application, pour que le fond de page en profite aussi (pas
  // seulement les cartes internes).
  useEffect(() => {
    document.documentElement.classList.remove("theme-clair", "theme-sombre");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <div className="app-shell">
      <div className="grid-backdrop" />
      <main>
        {sessionId ? (
          <Dashboard
            onLoggedOut={() => {
              setSessionId(null);
              setTheme("sombre");
            }}
            onThemeChange={setTheme}
          />
        ) : (
          <LoginForm onLoggedIn={setSessionId} />
        )}
      </main>
      <footer className="app-footer">Projet BDD Nouvelle Génération - Gestion de sessions Redis</footer>
    </div>
  );
}
