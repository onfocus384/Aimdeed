require("../helpers/env");

const test = require("node:test");
const assert = require("node:assert/strict");

const { app } = require("../../server");
const { redis } = require("../../config/redis");
const { cacheService } = require("../../services/redis");

let server;
let base;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  // Start from a clean rate-limit state for the test prefix.
  await cacheService.delByPrefix("aimdeed-test:rl:");
  await cacheService.delByPrefix("aimdeed-test:josaa:");
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await redis.quit().catch(() => {});
});

test("liveness /healthz returns 200 OK", async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "OK");
});

test("/health returns structured status", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
  assert.equal(body.service, "aimdeed-backend");
  assert.ok(body.uptime >= 0);
});

test("/ready reports dependency checks", async () => {
  const res = await fetch(`${base}/ready`);
  const body = await res.json();
  assert.ok("redis" in body.checks, "redis check present");
  assert.ok("supabase" in body.checks, "supabase check present");
  assert.ok(["ready", "not_ready"].includes(body.status));
});

test("security headers are applied", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.ok(res.headers.get("x-request-id"), "request id present");
});

test("CORS blocks disallowed origin", async () => {
  const res = await fetch(`${base}/api/payment/plans`, {
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(res.status, 500); // cors middleware errors → error handler
  const body = await res.json();
  assert.equal(body.error, "Internal server error");
});

test("CORS allows configured origin", async () => {
  const res = await fetch(`${base}/api/payment/plans`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("GET /api/payment/plans returns allowed amounts", async () => {
  const res = await fetch(`${base}/api/payment/plans`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.amounts, [499, 799, 999]);
});

test("GET /api/josaa returns cached JSON array", async () => {
  const res = await fetch(`${base}/api/josaa`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body), "josaa payload is an array");
  assert.ok(body.length > 0, "josaa payload non-empty");
});

test("GET /api/auth/me rejects unauthenticated requests", async () => {
  const res = await fetch(`${base}/api/auth/me`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /login/i);
});

test("POST /api/chat rejects unauthenticated requests", async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "hello" }),
  });
  assert.equal(res.status, 401);
});

test("POST /api/contact validates required fields", async () => {
  const res = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.message, "All fields are required.");
});

test("unknown route returns JSON 404", async () => {
  const res = await fetch(`${base}/definitely-not-a-route`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error, "Not found");
});

test("rate limiter returns 429 after contact limit", async () => {
  await cacheService.delByPrefix("aimdeed-test:rl:contact:");
  const results = [];
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${base}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    results.push(res.status);
  }
  // 5 allowed (400 validation) + 1 rejected (429)
  assert.equal(results.filter((s) => s === 429).length, 1);
  assert.equal(results.filter((s) => s === 400).length, 5);
});

test("JSON body limit rejects oversized payloads", async () => {
  const big = "x".repeat(2 * 1024 * 1024);
  const res = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: big, email: "a@b.c", message: big }),
  });
  assert.equal(res.status, 413);
});
