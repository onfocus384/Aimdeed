// Centralized environment access with sane defaults.
// All values come from process.env (dotenv is loaded in server.js).

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  PORT: parseInt(process.env.PORT, 10) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  // Comma-separated allow-list of origins for CORS.
  CORS_ORIGINS: toList(
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173",
  ),

  // Supabase (server-side admin client; anon key is only a fallback for auth verify)
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  REDIS_ENABLED: process.env.REDIS_ENABLED !== "false",
  REDIS_PREFIX: process.env.REDIS_PREFIX || "aimdeed",

  // Email (contact form)
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  CONTACT_TO: process.env.CONTACT_TO || "onfocus384@gmail.com",

  // Payments
  UPI_ID: process.env.UPI_ID || "",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

module.exports = env;
