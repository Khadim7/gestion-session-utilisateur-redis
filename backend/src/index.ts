import { Hono } from "hono";
import { cors } from "hono/cors";
import redis, { SESSION_TTL_SECONDS, sessionKey } from "./redisClient";
import type { SessionData, SessionResponse } from "./types";

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

async function readSession(sessionId: string): Promise<SessionResponse | null> {
  const raw = await redis.get(sessionKey(sessionId));
  if (!raw) return null;

  const data = JSON.parse(raw) as SessionData;
  const ttlSeconds = await redis.ttl(sessionKey(sessionId));

  if (ttlSeconds < 0) return null;

  return { ...data, ttlSeconds };
}

async function writeSession(data: SessionData): Promise<void> {
  // SET avec option EX : écrit la valeur et pose le TTL en une seule commande
  await redis.set(sessionKey(data.sessionId), JSON.stringify(data), "EX", SESSION_TTL_SECONDS);
}

const app = new Hono();

app.use("/api/*", cors({ origin: CORS_ORIGIN, credentials: true }));

app.get("/api/health", async (c) => {
  const pong = await redis.ping();
  return c.json({ status: "ok", redis: pong });
});

// Crée une nouvelle session pour un utilisateur
app.post("/api/session/login", async (c) => {
  const body = await c.req.json<{ username?: string }>().catch(() => ({} as { username?: string }));
  const username = body.username?.trim();

  if (!username) {
    return c.json({ error: "Le nom d'utilisateur est requis." }, 400);
  }

  const sessionId = crypto.randomUUID();
  const now = Date.now();

  const session: SessionData = {
    sessionId,
    username,
    createdAt: now,
    lastRefreshedAt: now,
    preferences: { theme: "sombre", langue: "fr" },
  };

  await writeSession(session);

  return c.json({
    sessionId,
    ttlSeconds: SESSION_TTL_SECONDS,
    message: `Session créée pour ${session.username}`,
  });
});

// Récupère l'état courant de la session
app.get("/api/session/me", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) {
    return c.json({ error: "En-tête x-session-id manquant." }, 401);
  }

  const session = await readSession(sessionId);
  if (!session) {
    return c.json({ error: "Session introuvable ou expirée." }, 401);
  }

  return c.json(session);
});

// Prolonge la durée de vie de la session
app.post("/api/session/refresh", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) {
    return c.json({ error: "En-tête x-session-id manquant." }, 401);
  }

  const exists = await redis.exists(sessionKey(sessionId));
  if (!exists) {
    return c.json({ error: "Session introuvable ou expirée." }, 401);
  }

  await redis.expire(sessionKey(sessionId), SESSION_TTL_SECONDS);

  const session = await readSession(sessionId);
  if (session) {
    session.lastRefreshedAt = Date.now();
    await writeSession(session);
  }

  return c.json({ message: "Session prolongée.", ttlSeconds: SESSION_TTL_SECONDS });
});

// Met à jour les préférences sans réinitialiser le TTL en cours
app.put("/api/session/preferences", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) {
    return c.json({ error: "En-tête x-session-id manquant." }, 401);
  }

  const session = await readSession(sessionId);
  if (!session) {
    return c.json({ error: "Session introuvable ou expirée." }, 401);
  }

  const body = await c.req
    .json<Partial<SessionData["preferences"]>>()
    .catch(() => ({} as Partial<SessionData["preferences"]>));

  const updated: SessionData = {
    ...session,
    preferences: { ...session.preferences, ...body },
  };

  // KEEPTTL : on remplace la valeur sans toucher au temps restant
  await redis.set(sessionKey(sessionId), JSON.stringify(updated), "KEEPTTL");

  return c.json({ message: "Préférences mises à jour.", preferences: updated.preferences });
});

// Supprime la session (déconnexion)
app.delete("/api/session/logout", async (c) => {
  const sessionId = c.req.header("x-session-id");
  if (!sessionId) {
    return c.json({ error: "En-tête x-session-id manquant." }, 401);
  }

  const deleted = await redis.del(sessionKey(sessionId));

  if (deleted === 0) {
    return c.json({ error: "Aucune session à supprimer (déjà expirée ?)." }, 404);
  }

  return c.json({ message: "Session supprimée." });
});

// Liste toutes les sessions actives (utilisé pour la vue temps réel du front)
app.get("/api/sessions", async (c) => {
  const sessions: SessionResponse[] = [];
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", "session:*", "COUNT", 100);
    cursor = nextCursor;

    for (const key of keys) {
      const sessionId = key.replace("session:", "");
      const session = await readSession(sessionId);
      if (session) sessions.push(session);
    }
  } while (cursor !== "0");

  return c.json({ count: sessions.length, sessions });
});

console.log(`Serveur démarré sur http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
