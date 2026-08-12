// Shared instances of the cache and rate-limit services backed by the Redis client.

const { redis, enabled } = require("../../config/redis");
const CacheService = require("./cacheService");
const RateLimitService = require("./rateLimitService");

const cacheService = new CacheService(redis, { enabled: enabled() });
const rateLimitService = new RateLimitService(redis, { enabled: enabled() });

module.exports = { cacheService, rateLimitService };
