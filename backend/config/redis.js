// Redis connection with reconnection strategy.
// Redis is a supporting cache/rate-limit layer ONLY — Supabase remains the source of truth.
// Frontend never talks to Redis; only the backend does.

const Redis = require("ioredis");
const env = require("./env");
const logger = require("../utils/logger");

let redis = null;
let enabled = env.REDIS_ENABLED;

function createRedisClient() {
  if (!enabled) return null;

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    connectTimeout: 3000,
    retryStrategy: (times) => {
      // Back off: 200ms → 3s, then stop retrying and let cache layer fail open.
      if (times > 15) return null;
      return Math.min(times * 200, 3000);
    },
  });

  client.on("error", (err) => {
    logger.warn("Redis error", { err: err.message });
  });
  client.on("ready", () => logger.info("Redis connected"));
  client.on("close", () => logger.warn("Redis connection closed"));
  client.on("reconnecting", () => logger.warn("Redis reconnecting"));

  return client;
}

async function connectRedis() {
  if (!enabled) return null;
  try {
    await redis.connect();
  } catch (err) {
    logger.warn("Redis connection failed — continuing without cache (fail-open)", {
      err: err.message,
    });
  }
  return redis;
}

async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
    } catch (err) {
      logger.warn("Error closing Redis", { err: err.message });
    }
    redis = null;
  }
}

redis = createRedisClient();

module.exports = { redis, enabled: () => enabled, connectRedis, closeRedis };
