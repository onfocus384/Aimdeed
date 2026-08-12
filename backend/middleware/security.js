// Security headers + CORS, applied centrally.
// CSP is disabled in development (Vite HMR injects inline styles/scripts) and
// enabled in production with a policy that preserves the app's CDN usage.

const helmet = require("helmet");
const env = require("../config/env");

const isProd = env.isProduction;

const cspPolicy = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // React inline style attributes
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
  ],
  fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
  imgSrc: ["'self'", "data:", "blob:", "https:"],
  connectSrc: ["'self'", "https:", "wss:"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

const helmetConfig = {
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: isProd ? { directives: cspPolicy } : false,
  frameguard: { action: "deny" },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
};

const securityHeaders = helmet(helmetConfig);

// Strict same-origin CORS allow-list (previously wide open).
const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, health checks) without an Origin header.
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  credentials: false,
  maxAge: 86400,
};

module.exports = { securityHeaders, corsOptions };
