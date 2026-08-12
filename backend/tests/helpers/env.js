// Loads deterministic test environment BEFORE any app module is required.
// dotenv never overrides already-set process.env, so these win.

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "error";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
process.env.REDIS_ENABLED = process.env.REDIS_ENABLED === "false" ? "false" : "true";
process.env.REDIS_PREFIX = process.env.REDIS_PREFIX || "aimdeed-test";
process.env.PORT = process.env.PORT || "3100";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:5173";
