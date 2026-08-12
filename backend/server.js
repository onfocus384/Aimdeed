require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const compression = require("compression");

const env = require("./config/env");
const logger = require("./utils/logger");
const { securityHeaders, corsOptions } = require("./middleware/security");
const requestId = require("./middleware/requestId");
const httpLogger = require("./middleware/httpLogger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { redis, connectRedis, closeRedis } = require("./config/redis");
const { supabaseAdmin } = require("./config/supabase");

const app = express();

// ======================
// HEADERS + LOGGING
// ======================
app.use(securityHeaders);
app.use(requestId);
app.use(httpLogger);

// ======================
// BODY + COMPRESSION
// ======================
app.use(compression());
app.use(express.urlencoded({ extended: true }));

// JOSAA dataset replacement can be ~3 MB; allow a larger body on that route only.
app.use("/api/josaa", express.json({ limit: "10mb" }));
// Everything else is small — enforce a strict 1 MB cap.
app.use(express.json({ limit: "1mb" }));

const staticOptions = {
  maxAge: env.isProduction ? "1y" : "0",
  immutable: env.isProduction,
};
app.use(express.static(path.join(__dirname, "public"), staticOptions));

// ======================
// CORS (allow-list)
// ======================
app.use(cors(corsOptions));

// ======================
// HEALTH + READINESS
// ======================
// Liveness: the process is up.
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// Liveness: human-readable process state.
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "aimdeed-backend",
    version: require("./package.json").version,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Readiness: dependencies reachable. Fails open for optional services (Redis)
// so the app keeps serving under partial outages.
app.get("/ready", async (req, res) => {
  const checks = {
    redis: "optional",
    supabase: "required",
  };

  const results = {};
  results.redis = await redis
    .ping()
    .then(() => "ok")
    .catch(() => "degraded");

  try {
    if (!supabaseAdmin) throw new Error("supabase not configured");
    const { data, error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    results.supabase = error ? "degraded" : "ok";
    void data;
  } catch {
    results.supabase = "degraded";
  }

  const healthy =
    results.supabase === "ok" && (results.redis === "ok" || results.redis === "degraded");

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ready" : "not_ready",
    checks: results,
    timestamp: new Date().toISOString(),
  });
});

// ======================
// ROUTES
// ======================
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api", require("./routes/chat.routes"));
app.use("/api", require("./routes/josaa.routes"));
app.use("/api", require("./routes/contact.routes"));

// ======================
// PRODUCTION: serve built React SPA (frontend/dist)
// ======================
if (env.isProduction) {
  const distDir = path.join(__dirname, "..", "frontend", "dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api|\/images|\/people|\/Books|\/css|\/js).*/, (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
}

// ======================
// 404 + ERROR HANDLER
// ======================
app.use(notFound);
app.use(errorHandler);

// ======================
// START
// ======================
let server;

function start() {
  server = app.listen(env.PORT, "0.0.0.0", async () => {
    logger.info("Aimdeed API Server started", { port: env.PORT, env: env.NODE_ENV });
    await connectRedis();
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(async () => {
    await closeRedis();
    logger.info("HTTP server closed, bye");
    process.exit(0);
  });

  // Hard-stop if graceful shutdown hangs.
  setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

if (require.main === module) {
  start();
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = { app, start, server };
