// Forme des données stockées dans Redis pour une session, sérialisées
// en JSON via la commande SET (clé = session:<sessionId>).
export interface SessionData {
  sessionId: string;
  username: string;
  createdAt: number; // timestamp epoch ms
  lastRefreshedAt: number; // timestamp epoch ms
  preferences: {
    theme: "clair" | "sombre";
    langue: "fr" | "en";
  };
}

export interface LoginBody {
  username: string;
}

export interface PreferencesBody {
  theme?: "clair" | "sombre";
  langue?: "fr" | "en";
}

// Réponse envoyée au client, on y ajoute le TTL restant (calculé via
// la commande Redis TTL) car ce n'est pas stocké dans la valeur elle-même.
export interface SessionResponse extends SessionData {
  ttlSeconds: number;
}
