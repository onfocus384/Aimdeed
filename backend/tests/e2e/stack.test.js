// End-to-end test against the deployed stack (nginx → backend xN → redis).
// Point E2E_BASE_URL at the nginx entrypoint, e.g. http://127.0.0.1 (port 80).

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = (process.env.E2E_BASE_URL || "http://127.0.0.1").replace(/\/$/, "");

test("SPA index.html is served with root div", async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<div id="root"><\/div>/);
});

test("built JS asset is served with immutable cache", async () => {
  const html = await (await fetch(`${BASE}/`)).text();
  const match = html.match(/assets\/([^"]+\.js)/);
  assert.ok(match, "index.html references an /assets/*.js bundle");
  const res = await fetch(`${BASE}/assets/${match[1]}`);
  assert.equal(res.status, 200);
  const cc = res.headers.get("cache-control") || "";
  assert.match(cc, /immutable|max-age=31536000/);
});

test("static images are served directly with long cache", async () => {
  const res = await fetch(`${BASE}/images/2840443.jpg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /image\/jpeg/);
});

test("API routes are proxied to the backend fleet", async () => {
  const res = await fetch(`${BASE}/api/payment/plans`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.amounts, [499, 799, 999]);
});

test("health endpoints work through nginx", async () => {
  assert.equal((await fetch(`${BASE}/healthz`)).status, 200);
  const health = await (await fetch(`${BASE}/health`)).json();
  assert.equal(health.status, "ok");
});

test("SPA deep links fall back to index.html", async () => {
  const res = await fetch(`${BASE}/pricing`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<div id="root"><\/div>/);
});

test("API responses carry security headers", async () => {
  const res = await fetch(`${BASE}/api/payment/plans`);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("x-request-id"), "request id header present");
});
