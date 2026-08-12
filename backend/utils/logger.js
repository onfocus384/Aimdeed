// Minimal structured logger. JSON-lines in production, human-readable in dev.
// Never log secrets: callers must not pass tokens/keys/passwords as fields.

const isProd = process.env.NODE_ENV === "production";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function emit(level, message, fields) {
  if (LEVELS[level] < LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] ) {
    return;
  }
  const entry = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(fields || {}),
  };
  const out = level === "error" || level === "warn" ? process.stderr : process.stdout;
  if (isProd) {
    out.write(`${JSON.stringify(entry)}\n`);
  } else {
    const extra = fields && Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : "";
    out.write(`[${entry.time}] ${level.toUpperCase()} ${message}${extra}\n`);
  }
}

const logger = {
  debug: (msg, fields) => emit("debug", msg, fields),
  info: (msg, fields) => emit("info", msg, fields),
  warn: (msg, fields) => emit("warn", msg, fields),
  error: (msg, fields) => emit("error", msg, fields),
};

module.exports = logger;
