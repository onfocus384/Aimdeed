// Request logging middleware: method, path, status, duration, request id.
// Safe fields only — never logs bodies, headers, tokens, or query strings with secrets.

const logger = require("../utils/logger");

const SKIP_PATHS = ["/healthz", "/health", "/ready"];

function httpLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const base = {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    requestId: req.id,
  };

  if (SKIP_PATHS.includes(base.path)) {
    return next();
  }

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("http", {
      ...base,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
    });
  });

  return next();
}

module.exports = httpLogger;
