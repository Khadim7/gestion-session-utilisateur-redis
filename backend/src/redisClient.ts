import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  // Reconnexion automatique en cas de coupure, utile en démo / TP
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("connect", () => {
  console.log("[redis] connecté à", process.env.REDIS_HOST, process.env.REDIS_PORT);
});

redis.on("error", (err) => {
  console.error("[redis] erreur de connexion :", err.message);
});

export const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? 900);

export const sessionKey = (sessionId: string) => `session:${sessionId}`;

export default redis;
