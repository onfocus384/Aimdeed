// Request ID / correlation ID middleware.
// Generates a UUID per request, propagates incoming X-Request-Id, and echoes it
// in the response so clients and proxies can correlate logs.

const { randomUUID } = require("crypto");

function requestId(req, res, next) {
  const incoming =
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    req.headers["x-varnish"];

  const id =
    incoming && typeof incoming === "string" && incoming.length <= 128
      ? incoming
      : randomUUID();

  req.id = id;
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  return next();
}

module.exports = requestId;
