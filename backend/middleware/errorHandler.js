// Centralized error handler. Converts thrown/next(err) errors into a consistent
// JSON shape and never leaks stack traces or internal details to clients.

const logger = require("../utils/logger");

class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Handles async route handler rejections (Express 5 auto-forwards these to next).
function notFound(req, res) {
  return res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const code = err.code || "internal_error";
  const message =
    status >= 500 ? "Internal server error" : err.message || "Request failed";

  logger.error("request error", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    code,
    err: err.message,
  });

  return res.status(status).json({
    error: message,
    ...(status >= 500 ? {} : { code }),
  });
}

module.exports = { AppError, notFound, errorHandler };
