// Cache-aside abstraction over Redis (cache layer only; never the source of truth).
// Every method fails open: if Redis is down, callers get a miss and fall through
// to Supabase/primary storage. Never cache passwords, tokens, or secrets.

const logger = require("../../utils/logger");
const env = require("../../config/env");

class CacheService {
  constructor(client, { prefix = env.REDIS_PREFIX, enabled = true } = {}) {
    this.client = client;
    this.enabled = enabled && !!client;
    this.prefix = prefix;
  }

  key(...parts) {
    return [this.prefix, ...parts].join(":");
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      const raw = await this.client.get(key);
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch (err) {
      logger.warn("Cache get failed (fail-open)", { key, err: err.message });
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.enabled) return false;
    try {
      const raw = typeof value === "string" ? value : JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, raw, "EX", ttlSeconds);
      } else {
        await this.client.set(key, raw);
      }
      return true;
    } catch (err) {
      logger.warn("Cache set failed", { key, err: err.message });
      return false;
    }
  }

  async del(...keys) {
    if (!this.enabled || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (err) {
      logger.warn("Cache del failed", { keys, err: err.message });
    }
  }

  // Delete all keys under a prefix using SCAN (never blocking KEYS).
  async delByPrefix(prefix) {
    if (!this.enabled) return;
    const pattern = `${prefix}*`;
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        if (keys && keys.length) {
          await this.client.del(...keys);
        }
        cursor = nextCursor;
      } while (cursor !== "0");
    } catch (err) {
      logger.warn("Cache delByPrefix failed", { prefix, err: err.message });
    }
  }

  // Cache-aside helper: returns cached value, or fetches + stores on miss.
  async cacheThrough(key, ttlSeconds, fetcher) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  async ping() {
    if (!this.enabled) return false;
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = CacheService;
