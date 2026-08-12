// Redis-backed fixed-window rate limiter + Express middleware factory.
// Fails open: if Redis is unavailable the request is allowed (availability > rate control).

const logger = require("../../utils/logger");
const env = require("../../config/env");

class RateLimitService {
  constructor(client, { enabled = true, prefix = env.REDIS_PREFIX } = {}) {
    this.client = client;
    this.enabled = enabled && !!client;
    this.prefix = prefix;
  }

  async hit(key, { limit, windowSeconds }) {
    if (!this.enabled) {
      return { allowed: true, remaining: Infinity, limit, windowSeconds };
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const window = Math.floor(now / windowSeconds);
      const bucketKey = [this.prefix, key, window].filter(Boolean).join(":");

      const results = await this.client
        .multi()
        .incr(bucketKey)
        .expire(bucketKey, windowSeconds + 1)
        .exec();

      const count = results && results[0] ? results[0][1] : 0;
      const allowed = count <= limit;
      return { allowed, remaining: Math.max(0, limit - count), limit, windowSeconds };
    } catch (err) {
      logger.warn("Rate limit check failed (fail-open)", { key, err: err.message });
      return { allowed: true, remaining: Infinity, limit, windowSeconds };
    }
  }

  // Middleware factory.
  middleware({ limit, windowSeconds, message, key }) {
    return async (req, res, next) => {
      const subject = req.user?.id || req.ip || "unknown";
      const result = await this.hit(`${key}:${subject}`, { limit, windowSeconds });

      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader(
        "X-RateLimit-Remaining",
        result.remaining === Infinity ? "unlimited" : String(result.remaining),
      );

      if (!result.allowed) {
        res.setHeader("Retry-After", String(windowSeconds));
        return res.status(429).json({
          error: message || "Too many requests. Please try again later.",
        });
      }
      return next();
    };
  }
}

module.exports = RateLimitService;
