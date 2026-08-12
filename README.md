# Aimdeed - NEET & JEE Preparation Platform

Aimdeed is a comprehensive educational platform designed to help students prepare for NEET and JEE examinations. It provides premium study materials, mentorship programs, an AI chatbot for study assistance, and a JEE rank predictor.

## 📑 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [High-Level Design (HLD)](#high-level-design-hld)
- [Low-Level Design (LLD)](#low-level-design-lld)
- [Redis Architecture](#redis-architecture)
- [Nginx Configuration](#nginx-configuration)
- [CI/CD](#cicd)
- [Security Hardening](#security-hardening)
- [Troubleshooting](#troubleshooting)
- [Baseline Report](#baseline-report)
- [Implementation Report](#implementation-report)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)

---

## 🏗️ Architecture

| Directory | Tech | Purpose | Port |
|-----------|------|---------|------|
| `backend/` | Express 5 + Supabase (Postgres + Auth) + Redis | REST API: auth (JWT), payments, AI chat, JOSAA predictor data, contact, caching, rate limiting | 3000 |
| `frontend/` | React 18 (Vite) + Supabase JS client | SPA UI (all pages) | 5173 |
| `deploy/nginx/` | Nginx 1.27 | Reverse proxy, load balancing, static asset caching, TLS, rate limiting | 80/443 |

```
Browser → Nginx (static SPA + assets, load balance, rate limit) → backend ×N (Express)
                                                                     ├── Redis (cache + rate limits, fails open)
                                                                     └── Supabase (Postgres + Auth — source of truth)
```

- **Supabase is the source of truth** (hosted Postgres + Auth). The frontend talks to Supabase directly for login/signup/OAuth/password reset; the backend verifies the Supabase JWT on protected routes and uses the service-role key for DB writes.
- **Redis is a supporting layer only** — cache + rate limiting. It is never the primary store, never exposed to the browser, and the API fails open if it is unavailable.
- Backends are **stateless and horizontally scalable** (`docker compose up --scale backend=N`).
- The original server-rendered monolith is preserved for reference under `legacy/`.
- For deploying the app, see [Deployment](#deployment).

---

## 🚀 Features
- **User Authentication**: Secure signup, login, and robust password reset functionality (Supabase Auth).
- **Role-based Access**: Protected routes for premium content, tools, and mentors.
- **AI Chatbot**: Integrated study assistant powered by Groq/xAI/OpenRouter.
- **Rank Predictor**: Data-driven JEE rank prediction using historical JOSAA data (Redis-cached).
- **Payment Gateway**: Built-in UPI-based payment system for premium access.
- **Modern UI/UX**: Distinctive, stunning blue-theme interface featuring glassmorphism and smooth animations.

---

## 🛠️ Prerequisites

- **Node.js** v22 or later (required by the Supabase JS SDK)
- **npm**
- **Docker + Docker Compose v2** (for the production stack)
- **Redis** (local or container — `docker run -d -p 6379:6379 redis:7-alpine`)
- **A Supabase project** — free tier at [supabase.com](https://supabase.com). You'll need the project URL, anon key, and service-role key (Dashboard → Settings → API).

---

## 💻 Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/pijush008/Aimdeed.git
cd Aimdeed
```

### 2. Install Dependencies
```bash
npm install         # root tools (concurrently)
npm run install:all # installs backend + frontend
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run `supabase/schema.sql` to create the `profiles` and `payments` tables, auto-profile trigger, and row-level security.
3. (Optional) Enable Google Sign-In in **Authentication → Providers → Google** and add the callback URL `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Copy the API keys (Settings → API) into your env files.

### 4. Environment Variables (development / test / production)
Create your env files from the templates. **Never commit the real `.env*` files.**

```bash
cp backend/.env.example backend/.env             # development (Redis, Supabase, SMTP, chat, UPI)
cp frontend/.env.example frontend/.env           # frontend Supabase keys
```

Environment templates included: `backend/.env.example`, `backend/.env.development`, `backend/.env.test`, `backend/.env.production`, `frontend/.env.example`.

### 5. Start the Application (development)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Health: `GET /healthz` (liveness) · `GET /health` (process) · `GET /ready` (Redis + Supabase dependencies)

### 6. Run the tests
```bash
npm test                    # backend unit + integration (integration needs local Redis)
npm run test:e2e            # full Docker stack (see below)
```

### 7. Local testing with Docker (before deploying)

```bash
docker compose up -d --scale backend=3 --build
curl http://localhost/healthz
curl http://localhost/ready
curl http://localhost/api/payment/plans
E2E_BASE_URL=http://127.0.0.1 npm run test:e2e
```

---

## 🚀 Deployment

Full step-by-step deployment instructions live in **[`deployment.md`](deployment.md)**. It covers:

- Deploying the **frontend** (`frontend/` folder) to **Vercel**
- Deploying the **backend** (`backend/` folder) to **Render**
- Setting up **Supabase** (database, schema, auth redirect URLs)
- Provisioning **Redis** and wiring `REDIS_URL`
- Connecting the custom domain **`www.aimdeed.in`** (Vercel + DNS records)
- Environment variables for every service and post-deploy checks

Deployment operations at a glance:

- **Logs**: `docker compose logs -f backend nginx`
- **Restart**: `docker compose restart`
- **Full reset**: `docker compose down -v` (drops Redis + JOSAA volumes — re-seed via PUT)
- **Rolling deploys**: `docker compose build backend && docker compose up -d --scale backend=N`
- **Data & state**: Redis persists in `redis-data` volume (AOF on); the JOSAA dataset persists in `josaa-data` volume shared by all backends; Supabase holds all user data.
- **Backend env reference**:

| Variable | Used for | Required |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase client/auth | Yes |
| `REDIS_URL`, `REDIS_ENABLED`, `REDIS_PREFIX` | cache + rate limit | Yes (compose injects) |
| `FRONTEND_URL`, `CORS_ORIGINS` | CORS allow-list | Yes |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `CONTACT_TO` | contact form email | Yes |
| `GROQ_API_KEY` / `XAI_API_KEY` / `OPENROUTER_API_KEY` | AI chat | Optional |
| `UPI_ID` | payment QR | Yes |
| `PORT`, `NODE_ENV`, `LOG_LEVEL` | runtime | defaults OK |

---

## 🔌 API Overview

> Auth is handled by **Supabase Auth** directly in the frontend (login, signup, Google OAuth, password reset). Protected backend routes expect an `Authorization: Bearer <access_token>` header, which the Supabase JS client provides automatically. Sensitive endpoints are rate-limited (Redis + Nginx).

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/healthz` | Liveness check | – |
| GET | `/health` | Process status JSON | – |
| GET | `/ready` | Dependency readiness (Redis/Supabase) | – |
| GET | `/api/auth/me` | Current user | JWT |
| GET | `/api/payment/plans` | Available amounts (499/799/999) | – |
| POST | `/api/payment/generate-qr` | Generate UPI QR for amount | JWT |
| POST | `/api/payment/confirm` | Submit UTR for payment | JWT |
| POST | `/api/chat` | AI study assistant | JWT |
| GET/PUT | `/api/josaa` | JOSAA college/rank data (GET cached 1 h) | PUT rate-limited |
| POST | `/api/contact` | Contact form (email) | – |

**Error contract** — errors are normalized by the centralized handler:

```json
{ "error": "Human-readable message", "code": "machine_code" }   // 4xx
{ "error": "Internal server error" }                            // 5xx (internals hidden)
```

---

## High-Level Design (HLD)

### 1. System Overview

Aimdeed is a three-tier web application:

- **Presentation**: React 18 SPA (Vite). Served statically by Nginx in production; Vite dev server locally.
- **Application**: Node.js (Express 5) REST API, horizontally scaled to **N instances** behind Nginx.
- **Data**: Supabase (hosted PostgreSQL + Auth) as the **source of truth**, Redis as a supporting cache/rate-limit layer, Gmail SMTP for transactional email.

```
                      ┌──────────────────────────────────────────────┐
                      │                  Browser/Client              │
                      └───────────────┬──────────────────────────────┘
                                      │ HTTPS (TLS terminated at Nginx)
                                      ▼
                        ┌─────────────────────────┐
                        │         NGINX           │  reverse proxy · load balancer ·
                        │   static SPA + assets   │  rate limiting · TLS · gzip · caching
                        └─────────────┬───────────┘
                      /api, /health   │  least_conn + keepalive
                    ┌─────────────────┴───────────────────┐
                    ▼                  ▼                  ▼
              ┌───────────┐      ┌───────────┐      ┌───────────┐
              │ backend-1 │      │ backend-2 │  …   │ backend-N │   Express 5 (Node 22)
              │  :3000    │      │  :3000    │      │  :3000    │   stateless · JWT auth
              └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌───────────┴───────────┐   ┌──┴───────────────────────────────┐
        │         Redis         │   │            Supabase               │
        │  cache + rate limit   │   │  Postgres (source of truth) + Auth │
        │  (NOT source of truth)│   │  profiles · payments tables + RLS  │
        └───────────────────────┘   └───────────────────────────────────┘
```

### 2. Non-Functional Goals

| Concern | Decision |
|---|---|
| **Scalability** | Stateless backends + shared Redis/Supabase → scale `docker compose up --scale backend=N` |
| **Availability** | Nginx health-checks backends; Redis **fails open** (cache is optional); readiness probe `/ready` |
| **Performance** | Nginx serves static assets with 1y immutable cache; Redis caches the 3 MB JOSAA payload; gzip on |
| **Security** | Helmet headers, strict CORS allow-list, per-endpoint + Nginx rate limiting, 1 MB body cap (10 MB JOSAA), non-root containers |
| **Observability** | Structured JSON logs, request IDs, `/health` + `/ready`, Nginx access log with upstream timing |
| **Maintainability** | Single backend codebase (no microservices), env-per-environment, full test suite |

### 3. Functional Flow (request lifecycle)

1. **Static content**: browser requests `/assets/index-*.js` → Nginx serves from disk with `Cache-Control: public, immutable, max-age=31536000`.
2. **SPA deep links**: any non-asset route → Nginx `try_files … /index.html` (client-side routing).
3. **API calls** (`/api/*`): Nginx enforces a shared IP rate-limit zone, forwards `X-Request-Id` + `X-Forwarded-*`, and proxies to a healthy backend via `least_conn` with upstream keepalive.
4. **Backend processing**: request ID middleware → security headers → structured logging → route handler (auth via Supabase JWT, Redis cache/rate-limit) → response.
5. **Graceful shutdown**: `SIGTERM`/`SIGINT` → stop accepting connections → drain in-flight requests → close Redis → exit.

### 4. Data Model (Supabase — source of truth)

```sql
-- auth.users          (managed by Supabase Auth)
-- public.profiles     (id, username, email, display_name, created_at, avatar_url, …)
-- public.payments     (id, user_id, payer_name, amount, utr_id, transaction_id, status, created_at)
```

- Row-Level Security (RLS) enabled; a trigger creates a profile row on signup. See `supabase/schema.sql`.
- The JOSAA dataset (`backend/data/josaa_data.json`, ~3 MB / 11.5k rows) remains a file, cached in Redis and updated via `PUT /api/josaa` (writes through the shared `josaa-data` volume).

### 5. Redis Usage (supporting layer only)

| Use | Key pattern | TTL | Fail behavior |
|---|---|---|---|
| JOSAA cache | `aimdeed:josaa:data` | 1 h | fail-open → re-read file |
| Rate limits | `aimdeed:rl:<policy>:<ip>:<window>` | 60–3600 s | fail-open → allow |
| (reserved) chat provider / feature flags | `aimdeed:…` | – | n/a |

Redis is **never** the source of truth, is **never** exposed to the browser, and holds **no secrets or PII that isn't also derivable elsewhere**. See [Redis Architecture](#redis-architecture).

### 6. Security Boundaries

1. **Edge (Nginx)**: TLS termination, request-size cap, IP rate-limit zones, dotfile deny.
2. **App (Express)**: Helmet security headers, CORS allow-list, JWT verification on protected routes, per-endpoint Redis rate limits, JSON body caps.
3. **Data**: service-role key only server-side; RLS enforced in Postgres; anon key (frontend) is public-by-design and scoped by RLS.

### 7. Deployment Topology

- **Local dev**: backend `:3000` + Vite `:5173` + local/container Redis.
- **Containerized**: `redis` + `backend` (scaled) + `nginx` behind host ports `80/443`. Supabase is external.
- **CI/CD**: GitHub Actions (unit/integration → Docker build → boot stack → e2e). See [CI/CD](#cicd).
- Full provisioning steps in [`deployment.md`](deployment.md).

### 8. Technology Summary

| Layer | Technology | Version notes |
|---|---|---|
| API | Node.js + Express | Node ≥ 22 (Supabase JS requires native WebSocket) |
| SPA | React 18 + Vite 5 | Builds to `frontend/dist` |
| Auth + DB | Supabase | Postgres, GoTrue, RLS |
| Cache / rate limit | Redis 7 | `redis:7-alpine` |
| Proxy | Nginx 1.27 | `nginx:1.27-alpine` |
| Email | Gmail SMTP via Nodemailer | App password |
| AI chat | Groq / xAI / OpenRouter | OpenAI-compatible SDK |

---

## Low-Level Design (LLD)

### 1. Backend Module Map (`backend/`)

```
backend/
├── server.js                     Express bootstrap, middleware chain, /healthz, /health, /ready, graceful shutdown
├── config/
│   ├── env.js                    Centralized env access (CORS allow-list, Redis, Supabase, SMTP, logging)
│   ├── redis.js                  ioredis client (lazyConnect, backoff, fail-open)
│   ├── supabase.js               Supabase admin client (service-role; null if creds missing)
│   └── email.js                  Nodemailer transporter (Gmail app password)
├── middleware/
│   ├── security.js               Helmet + CORS allow-list builder
│   ├── requestId.js              UUID / X-Request-Id correlation
│   ├── httpLogger.js             Structured access log (method, path, status, duration, requestId)
│   ├── auth.js                   isLoggedIn (Supabase JWT → profile enrich), isLoggedOut
│   └── errorHandler.js           AppError + notFound + centralized error responder
├── services/
│   ├── redis/
│   │   ├── index.js              Shared cacheService + rateLimitService instances
│   │   ├── cacheService.js       Cache-aside (get/set/del/delByPrefix/cacheThrough), fail-open
│   │   ├── rateLimitService.js   Fixed-window Redis limiter + Express middleware factory
│   │   └── rateLimits.js         Named policies per endpoint
│   └── josaa.js                  JOSAA file read/write + Redis cache + invalidation
├── routes/                       auth · chat · contact · josaa · payment
├── utils/logger.js               JSON-lines logger (prod) / pretty (dev)
├── data/josaa_data.json          ~3 MB JOSAA dataset (source file; shared volume in Docker)
└── tests/                        unit/ · integration/ · e2e/ · helpers/
```

### 2. Middleware Execution Order (`server.js`)

```
securityHeaders → requestId → httpLogger → compression → urlencoded/json parsers
  → static(backend/public) → cors → /api/josaa json(10mb) → json(1mb)
  → routes → (prod) SPA static + fallback → notFound → errorHandler
```

Ordering guarantees:
- Headers + request ID are set before any route can respond.
- The 10 MB body cap for `/api/josaa` is registered **before** the global 1 MB parser; body-parser skips once `req._body` is set.
- `notFound`/`errorHandler` are terminal and never leak stack traces for 5xx.

### 3. Request-ID & Logging Contract

- Middleware `requestId` reads `X-Request-Id` (or `X-Correlation-Id`) else generates a UUID; echoes it back and stores `req.id`.
- `httpLogger` logs every request (except `/healthz`, `/health`, `/ready`) with `requestId`, status, and duration.
- Errors from routes are additionally logged by `errorHandler` with `requestId`.
- Nginx preserves the browser/X-Request-Id into the backend via `proxy_set_header X-Request-Id $request_id`.

**Never log**: tokens, passwords, SMTP creds, service-role keys, full bodies.

### 4. Auth Flow (Supabase)

1. **Browser** → Supabase Auth (`supabase.co/auth/v1`) using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` for signup/login/Google/password reset.
2. Supabase JS stores the access token; `frontend/src/api/client.js` attaches `Authorization: Bearer <token>` to backend calls.
3. **Backend** `isLoggedIn`: `supabaseAdmin.auth.getUser(token)` → fetch `profiles` row → set `req.user`.
4. Protected routes: `auth/me`, `payment/generate-qr`, `payment/confirm`, `chat`, `chat-test`.

### 5. Rate Limiting (Redis, per instance + Nginx global)

| Policy | Limit | Window | Applied to |
|---|---|---|---|
| `authMe` | 60 | 60 s | GET /api/auth/me |
| `plans` | 60 | 60 s | GET /api/payment/plans |
| `generateQr` | 20 | 60 s | POST /api/payment/generate-qr |
| `paymentConfirm` | 10 | 60 s | POST /api/payment/confirm |
| `chat` | 30 | 60 s | POST /api/chat |
| `chatTest` | 5 | 60 s | GET /api/chat-test |
| `contact` | 5 | 60 s | POST /api/contact |
| `josaaUpdate` | 10 | 3600 s | PUT /api/josaa |

- Bucket key: `aimdeed:rl:<policy>:<subject>:<window>` where `<subject>` = `req.user.id ?? req.ip`.
- Algorithm: fixed window via `INCR` + `EXPIRE` in a MULTI. Fails open if Redis is down.
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` on 429.
- Nginx adds a global `limit_req` zone (`api_general` 30 r/s burst 60) that all instances share.

> Note: signup/login/password-reset are handled by **Supabase Auth directly from the browser**, so those cannot be rate-limited by our edge. Rely on Supabase Auth's built-in protections and keep the anon key public-by-design.

### 6. Caching (JOSAA)

- Read: `GET /api/josaa` → `cacheService.cacheThrough("aimdeed:josaa:data", 3600, readFile+parse)`.
- Update: `PUT /api/josaa` → write file (through shared `josaa-data` volume) → `del` cache key.
- Fail-open: Redis unavailable → read from file; PUT still writes the file.
- `JSON.parse` of ~3 MB happens at most once per hour per cache lifecycle; all instances share the cache key.

### 7. Health & Readiness

| Endpoint | Semantics | Response |
|---|---|---|
| `GET /healthz` | Liveness (process up) | `200 OK` |
| `GET /health` | Process details | `200` JSON `{status, service, version, uptime, timestamp}` |
| `GET /ready` | Dependency check | `200` JSON `{status:"ready", checks:{redis,supabase}}` when **supabase=ok** and redis is ok/degraded; else `503` |

- Redis is **optional** (`degraded` → still ready); Supabase is **required** (`degraded` → `503`).
- Docker `HEALTHCHECK` uses `/healthz`; orchestrators should use `/ready` for routing decisions.

### 8. Graceful Shutdown

- `SIGTERM`/`SIGINT` → `server.close()` (stops new connections, drains in-flight) → `redis.quit()` → `process.exit(0)`.
- Hard kill after 10 s via `setTimeout(...).unref()` so the process can't hang.

### 9. Error Contract

Success responses keep the original shapes (e.g. `{ amounts:[…] }`, `{ reply }`, `{ success, message }`, `{ qrImage }`).
Errors are now normalized by `errorHandler`:

```json
{ "error": "Human-readable message", "code": "machine_code" }   // 4xx
{ "error": "Internal server error" }                            // 5xx (internals hidden)
```

`AppError(status, message, code)` is available for routes that want a typed error.

### 10. Frontend Notes

- `frontend/src/lib/supabase.js`: browser client + access-token holder.
- `frontend/src/api/client.js`: token-aware `fetch` wrapper; reads `error || message` (both error shapes still supported).
- Dev proxy (`vite.config.js`): `/api`, `/images`, `/people`, `/Books`, `/css`, `/js`, `/favicon.ico` → backend `:3000`.
- Known pre-existing gap (unchanged by this work): `Payment.jsx` / `PaymentSuccess.jsx` are not routed in `App.jsx`.

### 11. Test Map

| Suite | Command | What it covers |
|---|---|---|
| Unit | `npm run test:unit` (backend) | cacheService, rateLimitService, errorHandler, rate-limit policies (21 tests) |
| Integration | `npm run test:integration` (backend) | live Express + Redis: endpoints, security headers, CORS, body limits, 429 (14 tests) |
| E2E | `npm run test:e2e` (backend) | full Docker stack through Nginx: SPA, assets, static, API proxy, health, deep links (7 tests) |

---

## Redis Architecture

Redis is a **supporting layer**: cache + rate limiting. It is **never the source of truth**, is **never exposed to the browser**, and holds **no secrets**.

### 1. Why Redis is here

| Problem | Solution |
|---|---|
| `GET /api/josaa` re-reads + re-parses a 3 MB JSON file on every request | Cache-aside with 1 h TTL |
| Per-instance rate limiting is bypassable by hitting different replicas | Shared Redis counters behind Nginx LB |
| No shared state between N backend instances | Redis is the shared in-memory coordination point |

Supabase/Postgres remains authoritative for all user data. If Redis disappears entirely, the API still works (fail-open); only caching and rate limiting degrade.

### 2. Key Namespace

Everything is namespaced by `REDIS_PREFIX` (default `aimdeed`) plus a purpose segment:

| Key | Type | TTL | Writer | Consumer |
|---|---|---|---|---|
| `aimdeed:josaa:data` | string (JSON) | 3600 s | josaa service on miss; `del` on PUT | `GET /api/josaa` |
| `aimdeed:rl:<policy>:<subject>:<window>` | counter | window + 1 s | rate-limit middleware | every protected/limited route |

`<subject>` = `req.user.id ?? req.ip`. `<window>` = `floor(epochSeconds / windowSeconds)`.

### 3. Cache-Aside Flow (JOSAA)

```
GET /api/josaa
  └─ cacheService.cacheThrough(key, 3600, fetcher)
        ├─ cache hit  → return JSON (no file IO)
        └─ cache miss → fetcher(): readFile + JSON.parse → SET EX 3600 → return

PUT /api/josaa  (validates array)
  └─ writeFile to shared josaa-data volume
     → cacheService.del(key)  // next GET re-reads the new file
```

- Invalidation is by **explicit delete** on write — no stale reads.
- `delByPrefix` uses `SCAN` (never blocking `KEYS`).

### 4. Rate Limiting

- Algorithm: **fixed window** — `INCR` + `EXPIRE` in a `MULTI`.
- Applies to all app endpoints (see [LLD §5](#5-rate-limiting-redis-per-instance--nginx-global)).
- Fails **open** (allows request) when Redis errors — availability over strict rate control.
- Exposes `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers and `Retry-After` on 429.
- Nginx enforces a **global** shared zone (`api_general`) in front of all instances; the Redis limiter is defense-in-depth per instance.

### 5. Fail-Open Design

Every Redis call is wrapped so the request path never crashes:

```js
try { … redis … } catch { return null / allowed }
```

Verified by unit tests (`cacheService`, `rateLimitService`) and by booting the backend with Redis down (see [Troubleshooting](#redis-is-down)).

### 6. Operations

```bash
docker compose exec redis redis-cli PING            # PONG
docker compose exec redis redis-cli SCAN 0 MATCH 'aimdeed:*' COUNT 100
docker compose exec redis redis-cli FLUSHALL        # dev only — clears cache+counters
```

- **Persistence**: `--appendonly yes --save 60 1000`. Cache rebuilds itself on miss, so losing Redis is cheap.
- **Eviction**: `--maxmemory 256mb --maxmemory-policy allkeys-lru` (cache is disposable).
- **Do not** `FLUSHALL` in production casually — it also resets rate-limit windows (safe, but users may burst once).

### 7. Security

- Redis binds to the internal compose network only (`expose: 6379`, no host port publish).
- No credentials stored in Redis (only cache payloads + counters).
- Service is not reachable from the browser; the backend is the only client.

### 8. What is deliberately NOT cached

- Passwords, tokens, service-role keys, payment UTRs (privacy + correctness).
- User profile data (fetched live from Supabase via JWT).
- Chat replies (dynamic; rate-limited instead).

### 9. Test Coverage

- `tests/unit/cacheService.test.js` — roundtrip, TTL, fail-open, cacheThrough, prefix delete.
- `tests/unit/rateLimitService.test.js` — allow/block, fail-open, middleware 429, headers.
- `tests/integration/api.test.js` — real Redis: 429 after limit, cache roundtrip through HTTP.

---

## Nginx Configuration

Edge reverse proxy: TLS termination, static serving with long-lived caches, load balancing, global rate limiting, request-size limits, and forward headers. Config lives at `deploy/nginx/nginx.conf` (baked into `Dockerfile.nginx`).

### 1. Responsibilities

| Responsibility | How |
|---|---|
| Reverse proxy | `proxy_pass` to `upstream aimdeed_backend` |
| Load balancing | `least_conn` across all `backend` replica IPs + upstream `keepalive 32` |
| TLS termination | commented block; enable with real certs (see §6) |
| Static SPA | `/assets/` → disk, `immutable` 1 y |
| Static assets | `/images /people /Books /css /js /favicon_io` → disk, 30 d |
| SPA deep links | `try_files $uri $uri/ /index.html` |
| Global rate limit | `limit_req` zones per client IP |
| Request size cap | `client_max_body_size 10m` on `/api/` (JOSAA dataset upload), 1 m elsewhere |
| Forward headers | `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Real-IP`, `X-Request-Id` |
| Compression | `gzip` + `gzip_static` for text/JSON/JS/CSS/SVG |
| Hygiene | `server_tokens off`, deny dotfiles |

### 2. Request Flow

```
Client ──► :80 ──► /assets/*      → served from /usr/share/nginx/html/assets (immutable)
                  /images|/people|/Books|/css|/js|/favicon_io/* → disk, 30d
                  /               → try_files → /index.html (SPA)
                  /api/*          → limit_req → upstream backend:3000
                  /healthz /health /ready → upstream (no app rate limit)
```

### 3. Upstream & Load Balancing

```nginx
upstream aimdeed_backend {
  least_conn;
  server backend:3000 max_fails=3 fail_timeout=10s;
  keepalive 32;
}
```

- With `docker compose up --scale backend=N`, the compose DNS name `backend` resolves to every replica's IP; Nginx balances across all of them (`least_conn` keeps the least-busy instance busy first).
- `max_fails=3 / fail_timeout=10s` removes a dead replica from rotation; Docker `HEALTHCHECK` on `/healthz` handles container-level restarts.
- Upstream keepalive: `proxy_http_version 1.1` + `proxy_set_header Connection ""` — required for persistent upstream connections.

### 4. Rate Limiting (global, shared across instances)

```nginx
limit_req_zone $binary_remote_addr zone=api_general:10m rate=30r/s;
location /api/ { limit_req zone=api_general burst=60 nodelay; }
```

- This is the **first line** of defense — it counts every instance's traffic against the same zone.
- Per-endpoint Redis limits (LLD §5) are the second line.
- 429s at the edge return Nginx's default HTML; the app-level 429s return JSON. Both are intentional.

### 5. Caching Headers

| Location | Header | Why |
|---|---|---|
| `/assets/` | `Cache-Control: public, immutable` + `Expires` 1 y | hashed filenames → content-addressed, safe to cache forever |
| `/images|…` | `Cache-Control: public` 30 d | stable URLs, large files |
| `/` (index.html) | `Cache-Control: no-cache` | always revalidate the SPA shell |

ETags are auto-generated (sendfile default) for validation requests.

### 6. TLS (enable for production)

Uncomment in the `server` block:

```nginx
listen 443 ssl http2;
ssl_certificate     /etc/nginx/certs/fullchain.pem;
ssl_certificate_key /etc/nginx/certs/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_session_cache shared:SSL:10m;
if ($scheme != "https") { return 301 https://$host$request_uri; }
```

Mount certs via compose:

```yaml
nginx:
  volumes:
    - ./certs:/etc/nginx/certs:ro
```

### 7. Timeouts & Buffering

```nginx
proxy_connect_timeout 5s;   # don't stall on a dead upstream
proxy_read_timeout    60s;  # AI chat can take a while
proxy_send_timeout    60s;
proxy_buffering on; proxy_buffer_size 4k; proxy_buffers 8 4k;
```

### 8. Body Size

- `/api/` → `client_max_body_size 10m` — the JOSAA `PUT` replaces the full ~3 MB dataset.
- Everything else → `1m` (contact/chat/payment payloads are tiny).
- Express mirrors this (`1mb` global, `10mb` for `/api/josaa`).

### 9. Verification

```bash
docker compose exec nginx nginx -t          # config syntax check
docker compose logs -f nginx                # access log: status, upstream_addr, upstream_time
curl -sI http://localhost/assets/index-*.js  # Cache-Control: immutable
```

---

## CI/CD

Pipeline file: `.github/workflows/ci.yml`. It runs on **push and pull requests** to `main`/`master`.

### 1. Pipeline Stages

| Job | Steps | Guards the pipeline against |
|---|---|---|
| `test` | Node 22 setup; `npm ci` (backend+frontend); unit tests; integration tests against a **Redis service container**; production frontend build | Logic regressions, broken deps, Redis-path bugs, SPA build errors |
| `docker` | builds `aimdeed-backend` + `aimdeed-nginx`; boots the full compose stack with 3 backend replicas; waits for `/healthz`; runs the **e2e suite**; dumps logs on failure | Image misconfiguration, Nginx config errors, multi-instance / LB regressions |
| `deployment-summary` | (push to main only) deploy notification banner | n/a |

Adjacent (automatic, no jobs): **DeepSource** code quality (`.deepsource.toml`) and **Dependabot** dependency security.

### 2. Why Node 22

- `@supabase/supabase-js` ≥ 2.45 needs native WebSocket — Node ≥ 22 (locally and in images).
- Runtime `engines` in `backend/package.json` is `>=22.0.0`.

### 3. Docker Job Details

1. `docker build -t aimdeed-backend:ci .`
2. `docker build -t aimdeed-nginx:ci -f Dockerfile.nginx .`
3. `cp backend/.env.example backend/.env.production` (placeholders; tests exercise fail-open paths).
4. `docker compose up -d --scale backend=3`
5. Poll `/healthz` (up to 60 s) → fail with logs if never healthy.
6. `npm run test:e2e --prefix backend` against `E2E_BASE_URL=http://127.0.0.1`.

### 4. Deployment

The pipeline stops after verification. See **[`deployment.md`](deployment.md)** for the options (Vercel + Render, all-in-one VPS, managed PaaS) and how to wire an automatic deploy step.

### 5. Secrets Required (GitHub → Settings → Secrets → Actions)

Secrets are consumed by deploy/CI jobs only — the test jobs run on placeholders.

| Secret | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | deploy |
| `EMAIL_USERNAME`, `EMAIL_PASSWORD` | deploy |
| `GROQ_API_KEY` / `XAI_API_KEY` / `OPENROUTER_API_KEY` | deploy |
| `UPI_ID` | deploy |
| `SSH_PRIVATE_KEY` (VPS deploy) | deploy |
| `REDIS_URL` (managed Redis) | deploy |

### 6. Local Equivalents

```bash
npm run test:unit --prefix backend        # unit
npm run test:integration --prefix backend # integration (needs local Redis)
npm run build --prefix frontend           # SPA build
docker compose up -d --scale backend=3 --build   # stack boot
E2E_BASE_URL=http://127.0.0.1 npm run test:e2e --prefix backend  # e2e
```

---

## Security Hardening

### 1. What was hardened (vs. baseline)

| Area | Before | After |
|---|---|---|
| Security headers | none | Helmet: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cross-Origin-Resource-Policy`, CSP (prod), HSTS (prod) |
| CORS | `origin: () => true` (wide open) | strict allow-list from `CORS_ORIGINS` env |
| Rate limiting | none | Redis per-endpoint limits + Nginx global zones |
| Body size | unbounded | 1 MB default, 10 MB for `/api/josaa` |
| Error responses | inconsistent; some leaked internals | normalized; 5xx internals hidden |
| Request size / timeout | n/a | Nginx `client_max_body_size`, connect/read/send timeouts |
| Logging | raw `console.*` | structured, request-ID correlated, secrets never logged |
| Runtime user | root in image | non-root `node` user |
| Server banner | n/a | `server_tokens off` |
| Shutdown | abrupt | graceful drain on SIGTERM/SIGINT |

### 2. Defense in Depth (three layers)

1. **Edge (Nginx)** — TLS (enable in prod), IP rate-limit zones, body-size caps, dotfile deny, `server_tokens off`, forward headers with `X-Request-Id`.
2. **App (Express)** — Helmet headers, CORS allow-list, JWT verification on protected routes, per-endpoint Redis rate limits, body caps, error handler that never leaks stack traces or internal paths.
3. **Data (Supabase)** — RLS policies in `supabase/schema.sql`; service-role key is **server-side only**; anon key is public-by-design and scoped by RLS. Redis is internal-only (no published port).

### 3. Authentication & Sessions

- Supabase Auth (GoTrue) handles credentials; passwords are never stored or handled by this app.
- The backend verifies the Supabase JWT on every protected route (`isLoggedIn`) and enriches with the `profiles` row.
- `Authorization: Bearer <token>` is read from the header; tokens are not logged.

### 4. Secrets Handling

- `.env*` files are git-ignored; only `.env.example` / `.env.development` / `.env.test` / `.env.production` **templates** are committed.
- `.dockerignore` excludes all `.env*`.
- Service-role key, SMTP app password, chat API keys, UPI ID are runtime env only.
- Nginx never receives or forwards `Authorization` to anything but the backend.

### 5. Remaining Known Gaps (accepted / flagged)

| Gap | Status | Recommendation |
|---|---|---|
| `PUT /api/josaa` is unauthenticated (anyone can replace the dataset) | **pre-existing**, preserved for functionality | Move behind an admin role check or Supabase RLS admin token; rate-limited (10/h/IP) meanwhile |
| `GET /api/chat-test` debug endpoint is exposed | **pre-existing**, preserved | Restrict to admins or remove after debugging; it is auth-protected + rate-limited now |
| `isLoggedOut` middleware is unused | **pre-existing** | Wire into login/signup flows when they are reintroduced backend-side |
| CSP disabled in dev (Vite HMR) | intentional | Enabled in production only |
| Chat API key detection by prefix | design | Prefer explicit `*_API_KEY` env vars; never commit them |
| Supabase browser-side login rate limits | external | Rely on Supabase Auth built-ins; consider Cloudflare WAF at the edge |
| `nodemailer` < 9 (HIGH audit) | **pre-existing** | Upgrade requires a breaking major bump — verify contact-email flow then upgrade in a dedicated change |

### 6. Audit Status

- `npm audit` is **not** a CI gate yet (baseline has known frontend findings: esbuild/vite/react-router majors). Add `npm audit --audit-level=high` to CI **after** the upgrade PRs land, so CI never goes red on known-unfixed items.

### 7. Security Checklist (before launch)

- [ ] TLS enabled with real certs (see [Nginx §6](#6-tls-enable-for-production))
- [ ] `backend/.env.production` has **real** secrets; no real `.env` committed
- [ ] `PUT /api/josaa` admin-gated
- [ ] `nodemailer` major upgrade verified
- [ ] Supabase RLS reviewed for `payments` (user can only read own rows)
- [ ] Managed Redis with auth (`REDIS_URL=rediss://user:pass@…`), if using a hosted provider
- [ ] `npm audit` gated in CI

---

## Troubleshooting

### Backend won't start

| Symptom | Cause | Fix |
|---|---|---|
| `OpenAIError: Missing credentials` at boot | No chat API key in env; OpenAI SDK throws at construction | Set `GROQ_API_KEY` / `XAI_API_KEY` / `OPENROUTER_API_KEY`, or restart with the placeholder guard (already fixed: client is constructed with `apiKey: "missing"` and routes validate before use) |
| `native WebSocket not found` | Node < 22 with `@supabase/supabase-js` | Use Node ≥ 22 (see `engines`) |
| `EACCES … data/josaa_data.json` | data dir owned by root, runtime user is `node` | Rebuild image (Dockerfile chowns the dir); run with the compose `josaa-data` volume |
| `EADDRINUSE :3000` | another backend running | `lsof -ti:3000 | xargs kill`, or set `PORT` |

### Redis is down

- Expected behavior: **fail-open** — the API keeps working, `/ready` reports `redis: degraded` (still 200 if Supabase is ok), caching stops, rate limits bypassed.
- Logs: `WARN Redis connection failed — continuing without cache (fail-open)`.
- If using the bundled container: `docker compose up -d redis`; check `docker compose logs redis`.

### Supabase not configured / degraded

- `supabaseAdmin` is `null` when `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are missing → protected routes return `401/500`, `/ready` reports `supabase: degraded` (503).
- Fix: set the three Supabase env vars and restart. Verify: `curl /ready` → `"supabase":"ok"`.

### 429 Too Many Requests

- App-level JSON 429 → you hit a per-endpoint Redis limit (LLD §5). Wait for the window or raise the policy in `backend/services/redis/rateLimits.js`.
- Nginx HTML 429 → you hit the global `api_general` zone (30 r/s). Rare for humans; typical for bad client loops.
- Quick test reset: `docker compose exec redis redis-cli FLUSHALL` (dev only).

### Slow responses

- `GET /api/josaa` slow on a cold cache → first request re-reads+parses 3 MB; subsequent are cache hits.
- Upstream timeout: Nginx `proxy_read_timeout 60s`; chat replies can take seconds — ensure the frontend has no shorter timeout.
- Verify which instance handled a request: Nginx access log `upstream_addr` + `upstream_time`.

### Load balancing not spreading traffic

- Nginx resolves `backend` to all replica IPs only if all replicas are healthy. Confirm: `docker compose ps` (all `healthy`) and `docker compose exec nginx getent hosts backend`.
- Recreated one replica? `docker compose up -d --scale backend=3` to converge.

### JOSAA data wrong / stale after PUT

- Flow: `PUT /api/josaa` writes the file (shared `josaa-data` volume) then deletes the cache key. If you GET from an instance with a different volume, it's stale.
- Force refresh: `docker compose exec redis redis-cli DEL aimdeed:josaa:data` (cache is rebuilt on next GET).
- If the file was corrupted by a bad PUT, restore by re-PUTting a valid array (see `backend/data/josaa_data.json`).

### Contact email not sending

- Nodemailer uses Gmail app password (`EMAIL_USERNAME`/`EMAIL_PASSWORD`). Check `docker compose logs backend` for `Email send failed`.
- Test: `POST /api/contact` with `{name,email,message}` → expect `success:true` and a confirmation email.
- Known: upgrading `nodemailer` past 7 fixes a HIGH audit finding but is a breaking change — verify the whole flow in a dedicated change.

### Chat returns errors

- `401`/`invalid api key`: wrong `GROQ_API_KEY`/`XAI_API_KEY`/`OPENROUTER_API_KEY`, or key prefix doesn't match provider detection.
- `429` from provider: fallback model chain already retries across models; the route returns a friendly message.
- `Missing credentials` at boot: see first table row.

### Tests failing

| Command | Requires | Notes |
|---|---|---|
| `npm run test:unit` | nothing | pure unit |
| `npm run test:integration` | local Redis on `:6379` | `REDIS_PREFIX=aimdeed-test`; start via `docker run -d -p 6379:6379 redis:7-alpine` |
| `npm run test:e2e` | booted stack | `E2E_BASE_URL` must point at Nginx (default `http://127.0.0.1`) |

CI runs all three with a Redis service container; integration/e2e failures are **not** hidden.

### Logs & Observability

```bash
docker compose logs -f backend nginx redis
docker compose logs backend | grep '"level":"error"'          # JSON-lines in prod mode
curl http://localhost/health | jq                              # process info
curl http://localhost/ready | jq                               # dependency checks
```

Every HTTP log line carries `requestId` — grep it in both Nginx and backend logs to trace one request across the fleet.

### Ports

| Port | Owner | Notes |
|---|---|---|
| 80 / 443 | Nginx | production entrypoint |
| 3000 | backend | internal (compose `expose`) |
| 6379 | Redis | internal only |
| 5173 | Vite dev server | local development |

---

## Baseline Report

> Captured before any production-architecture changes. Date: 2026-08-11.
> This document proves that subsequent infrastructure changes did not break existing functionality.

### 1. Current Architecture

A monorepo with three packages plus a preserved legacy app:

| Package | Path | Tech | Port |
|---------|------|------|------|
| Root tooling | `/` | npm scripts + concurrently | — |
| Backend API | `backend/` | Express 5 (CommonJS), Supabase JS client | 3000 |
| Frontend SPA | `frontend/` | React 18, Vite 5, React Router 6, motion | 5173 |
| Legacy monolith | `legacy/` | Express + EJS (preserved reference, unused) | — |

### Request flow

```
Client
  ↓
Frontend (React SPA @ :5173)   ← Vite proxies /api, /images, /people, /Books, /css, /js
  ↓
Backend API (Express @ :3000)
  ├── /api/josaa        → local JSON file (backend/data/josaa_data.json, ~3 MB)
  ├── /api/chat         → Groq / xAI / OpenRouter (OpenAI-compatible HTTP)
  ├── /api/contact      → SMTP (nodemailer → Gmail)
  ├── /api/payment/*    → Supabase PostgreSQL (payments table)
  ├── /api/auth/me      → Supabase Auth (JWT verify) + profiles table
  ↓
Supabase (PostgreSQL + Auth)  ← source of truth
```

### Stack details (as audited)

- **Frontend**: React 18.3, Vite 5.4, react-router-dom 6.26, motion (framer-motion successor), `@supabase/supabase-js`.
- **Backend**: Express 5.2 (CommonJS), `@supabase/supabase-js` (service-role/admin client), nodemailer (SMTP), openai (chat), qrcode (UPI QR), cors, compression, dotenv.
- **Authentication**: Supabase Auth, client-side (email/password + Google OAuth). Frontend holds the Supabase session; backend verifies the JWT (`Authorization: Bearer …`) on protected routes. No cookies/sessions server-side.
- **Authorization**: Route-level middleware `isLoggedIn` on the backend (JWT verify + profile enrich). Frontend `ProtectedRoute`/`GuestRoute` for UI routing only (not security).
- **Database**: Supabase PostgreSQL. Tables: `profiles`, `payments`. DDL in `supabase/schema.sql`. RLS enabled on both tables. No migrations tooling; single idempotent schema file.
- **External APIs**: Groq/xAI/OpenRouter (chat), Gmail SMTP (contact + transactional email), UPI QR generation (static).
- **File storage**: None (static assets shipped in image).
- **Background jobs / cron / WebSockets**: None.
- **Cache / rate limiting / CDN**: None.
- **TypeScript**: None. **Linting**: None. **Tests**: None (root `npm test` is a stub that exits 1).

### Routes inventory (baseline)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/healthz` | public | plain liveness string |
| GET | `/api/payment/plans` | public | static `{amounts:[499,799,999]}` |
| GET | `/api/josaa` | public | ~3 MB JSON from file |
| PUT | `/api/josaa` | public (documented as admin) | overwrites the JSON file |
| POST | `/api/contact` | public | sends 2 emails |
| POST | `/api/chat` | JWT | expensive external AI call |
| GET | `/api/chat-test` | JWT | debug route |
| GET | `/api/auth/me` | JWT | returns profile |
| POST | `/api/payment/generate-qr` | JWT | returns QR data URL |
| POST | `/api/payment/confirm` | JWT | inserts into `payments` |
| GET | `/` `/mentor` `/privacy` `/terms` `/cookies` | public | SPA (prod: served by backend) |
| GET | `/studies` `/predictor` `/chatbot` `/student` | JWT (UI) | SPA protected routes |
| GET | `/login` `/signup` `/forgot-password` `/reset-password` | guest-only (UI) | SPA |

### Baseline commands executed

| Command | Result |
|---------|--------|
| `npm install` (root/backend/frontend) | OK |
| `node backend/server.js` (NODE_ENV=test) | OK — listens on 0.0.0.0 |
| `curl /healthz` | `200 OK` |
| `curl /api/payment/plans` | `200 {"amounts":[499,799,999]}` |
| `curl /api/auth/me` (no token) | `401 {"error":"Please login first!"}` |
| `curl POST /api/chat` (no token) | `401 {"error":"Please login first!"}` |
| `curl GET /api/josaa` | `200` (3,033,280 bytes) |
| `curl POST /api/contact` (empty body) | `400 {"success":false,"message":"All fields are required."}` |
| `curl GET /api/nonexistent` | `404 {"error":"Page Not Found"}` |
| `npm run build` (frontend) | OK — 502 modules, 593 KB JS / 20 KB CSS |
| `npm run dev` (frontend, Vite) | OK (already running on :5173 during audit) |
| Backend live on :3000 (user dev env) | OK |

### Dependency security scan (npm audit)

**Backend (production deps)**
- **1 high**: `nodemailer <=9.0.0` — SMTP command injection (GHSA-c7w3-x93f-qmm8), CRLF injection in transport name (GHSA-vvjj-xcjg-gr5g), List-* header injection (GHSA-268h-hp4c-crq3), jsonTransport file/URL access bypass (GHSA-wqvq-jvpq-h66f), TLS validation in OAuth2 token fetch (GHSA-r7g4-qg5f-qqm2), raw-option SSRF/file-read (GHSA-p6gq-j5cr-w38f).
  - Fix: `nodemailer@9.0.5` (breaking major). Must verify email config + code compatibility.

**Frontend**
- **3 moderate + 1 high**:
  - `esbuild <=0.24.2` — dev-server request hijacking (GHSA-67mh-4wv8-2f99). Dev-time only.
  - `vite <=6.4.2` — depends on vulnerable esbuild.
  - `react-router / react-router-dom 6.0.0–7.17.0` — open redirect via backslash in `<Link>` (CVE-2025-68470 bypass) and arbitrary constructor injection via `deserializeErrors()`.
  - Fix paths require major upgrades (vite@8, react-router v7). Must verify compat before upgrading.

### Existing functionality (regression checklist)

- [x] Public home/legal/mentor pages render (SPA).
- [x] Backend serves `/healthz`, plans, josaa, contact validation, 404s.
- [x] Protected routes return 401 without a JWT (auth enforced server-side).
- [x] Frontend production build succeeds.
- [x] Supabase client-side auth wired (login/signup/google/reset) — requires real Supabase creds to exercise end-to-end.
- [x] UPI payment flow backend (QR + confirm → `payments` table).
- [x] AI chatbot backend (multi-provider fallback).
- [x] JOSAA predictor data endpoint.

### Known issues (pre-existing)

1. **No automated tests** — root `npm test` exits 1.
2. **No linting / static analysis** configured in repo (DeepSource is external).
3. **Unpatched dependency vulnerabilities** (see above). Backend nodemailer high is real; frontend ones are mostly dev/route-level.
4. **`/api/josaa` returns ~3 MB** on every request with no caching — high-value cache candidate.
5. **CORS is fully open** (`origin → true`) — tighten for production.
6. **No rate limiting** on any endpoint (login/chat/contact/payment are exposed).
7. **No structured logging or request IDs** — plain `console.info`.
8. **`/healthz` only** — no readiness check, no dependency checks (Redis/Supabase).
9. **No graceful shutdown** — SIGTERM just kills the process (breaks clean rolling deploys).
10. **Inconsistent error shapes** across routes (`{error}`, `{success,message}`, `{reply}`). Frontend `client.js` reads `error || message`, so shapes must stay compatible.
11. **`/api/josaa` PUT** is unauthenticated (documented as admin-only) — IDOR/privilege gap.
12. **`/api/chat-test`** debug route is exposed (JWT-only but unnecessary in prod).
13. **Payment pages (`Payment.jsx`, `PaymentSuccess.jsx`) are not routed** in `App.jsx` — unreachable UI (pre-existing).
14. **`/api/auth/me`** exists but the frontend currently uses `supabase.auth.getUser()` directly.
15. **`isLoggedOut` middleware** is now unused (no server-side login routes remain after Supabase migration).
16. **Reset-password route** changed to `/reset-password` (hash-based Supabase recovery) — requires Supabase Auth redirect config.
17. **Login is email-based** (Supabase); username retained as display name only.
18. **No environment separation** (single `.env` per package; no test/staging/prod templates).
19. **Single backend instance, no reverse proxy / load balancing**; Redis/Nginx absent.
20. **No graceful handling of Redis/dependency outages** (N/A yet — Redis not present).

### Infrastructure snapshot (local dev machine)

- Node v22.21.1, npm 11.18.0, Docker 29.7.2, Docker Compose v5.0.1, Supabase CLI 2.109.1.
- Redis server: **not installed locally** (will run via Docker for dev/testing).
- Nginx: **not installed locally** (will run via Docker).
- Live during audit: backend :3000, frontend Vite :5173.

---

## Implementation Report

**Date:** 2026-08-11
**Scope:** Hardening the Aimdeed NEET/JEE platform from a single-instance Express + Supabase app into a production-style architecture (Redis, Nginx, horizontally scaled backends, CI/CD, automated testing, security hardening, full documentation) without breaking existing functionality.

### 1. Executive Summary

All planned work was implemented **and verified live**. A previous session migrated the app from MongoDB to Supabase (Postgres + Auth); this session built the production architecture on top of that baseline.

- **All existing functionality preserved** — every baseline endpoint passes a regression check; the frontend builds to the same 593 KB JS / 20 KB CSS bundle.
- **42 automated tests** pass (21 unit + 14 integration + 7 e2e), including a full e2e suite against the live Docker stack (Nginx → 3 backend replicas → Redis).
- **Two real production bugs** were found and fixed (OpenAI SDK crashing the container at boot without a key; `node` user unable to write the JOSAA dataset).
- **No tests were hidden**; nothing failing is silently skipped.

### 2. What Was Delivered

| Component | Status |
|---|---|
| Redis cache + rate limiting (backend-only, fail-open) | ✅ live + tested |
| Nginx reverse proxy / load balancer / static cache / global rate limit | ✅ live + tested |
| Multi-instance backends (`--scale backend=3`), `least_conn` + keepalive | ✅ verified (traffic spread across 3 IPs) |
| Health endpoints: `/healthz` (liveness), `/health` (process), `/ready` (Redis+Supabase deps) | ✅ live + tested |
| Graceful shutdown (SIGTERM/SIGINT drain) | ✅ verified |
| Structured JSON logging + request-ID correlation | ✅ live + tested |
| Helmet security headers + strict CORS allow-list | ✅ live + tested |
| Centralized error handler (no internal leaks on 5xx) | ✅ live + tested |
| Environment separation (.env.example/.development/.test/.production) | ✅ done |
| CI/CD: unit/integration → Docker build → stack boot → e2e | ✅ configured |
| TLS termination config (documented; needs real certs) | ✅ documented |

### 3. Verification Results

**Regression vs baseline**

| Check | Baseline | Now |
|---|---|---|
| `GET /healthz` | 200 | 200 ✅ |
| `GET /api/payment/plans` | 200 `{amounts:[499,799,999]}` | 200 ✅ |
| `GET /api/auth/me` (no token) | 401 | 401 ✅ |
| `POST /api/contact` (empty body) | 400 | 400 ✅ |
| Unknown route | 404 JSON | 404 JSON ✅ |
| `GET /api/josaa` | 200 (~3 MB) | 200 ✅ (now Redis-cached) |
| Frontend production build | 593 KB JS / 20 KB CSS | same ✅ |

**Tests (all passing, none hidden)**
- **Unit (21):** cacheService, rateLimitService, errorHandler, rate-limit policies.
- **Integration (14):** live Express + Redis — endpoints, security headers, CORS allow/block, body limits (413), rate limit 429.
- **E2E (7):** live Docker stack via Nginx — SPA, immutable asset caching, static images, API proxy, health, deep links, headers.

**Live stack**
`redis` + `backend ×3` + `nginx` all **healthy**; `nginx -t` passes; load balancing confirmed across 3 replica IPs; JOSAA `PUT`→invalidate→`GET` round-trip verified across replicas via the shared `josaa-data` volume.

### 4. Bugs Found & Fixed During This Work

| Bug | Impact | Fix |
|---|---|---|
| OpenAI SDK throws at module load with no API key | **Container crashed at boot** in any env without a chat key | Placeholder key + existing validation guard (routes still return a friendly 400) |
| `@supabase/supabase-js` requires Node ≥ 22 (native WebSocket) | supabaseAdmin null → auth/payments degraded | Dockerfiles + `engines` bumped to Node 22 |
| `node` user couldn't write `data/josaa_data.json` (EACCES) | `PUT /api/josaa` always 500 in containers (pre-existing) | Dockerfile `chown` + shared `josaa-data` volume across replicas |
| 1 MB body cap would reject the 3 MB JOSAA upload | Feature regression | 10 MB cap scoped to `/api/josaa` (Express + Nginx) |
| Rate-limit keys not namespaced | Cross-env interference; flush couldn't target them | Keys now under `aimdeed:rl:*` prefix |

### 5. Remaining Known Gaps

| Gap | Status | Impact |
|---|---|---|
| `PUT /api/josaa` unauthenticated (anyone can replace dataset) | pre-existing, preserved | Low–med (rate-limited 10/h/IP); **should be admin-gated** |
| `GET /api/chat-test` debug endpoint exposed | pre-existing, preserved | Low (auth-protected + rate-limited); remove/restrict for launch |
| `nodemailer` < 9 (HIGH audit) | deferred | Breaking major upgrade; verify contact-email flow first |
| Frontend deps (vite/esbuild/react-router) audit findings | deferred | Require major upgrades (separate PR) |
| TLS not actually enabled | config ready, needs real certs | Mandatory before prod traffic |
| Login/signup rate limiting | handled by Supabase Auth (external) | Not controllable at our edge |

### 6. Recommendations Before Production Launch

1. Enable TLS with real certificates (uncomment block in `deploy/nginx/nginx.conf`, mount certs).
2. Admin-gate `PUT /api/josaa` (role check or Supabase admin token).
3. Run one full live smoke test with **real Supabase credentials** (signup → login → chat → payment submit) — the only flows not verified end-to-end (no real creds were available).
4. Upgrade `nodemailer` → 9 and the flagged frontend majors in dedicated PRs, then gate `npm audit` in CI.
5. Add secrets to GitHub → CI/CD deploy job for automatic deployment.

### 7. Verdict

# ✅ READY FOR STAGING

**Rationale:** The architecture, hardening, and test infrastructure are complete and verified against a live multi-instance stack; all existing functionality is preserved with no known regressions and no hidden test failures. The platform is **not yet certified for production** solely because production requires external prerequisites that were out of scope of this work: real Supabase credentials for a live auth/payment smoke test, TLS certificates, admin-gating of `PUT /api/josaa`, and the deferred dependency upgrades (notably `nodemailer` HIGH). Once those four items are done, the platform meets the bar for **READY FOR PRODUCTION**.

---

## 🤝 Contribution Guidelines
1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License
Distributed under the ISC License.
