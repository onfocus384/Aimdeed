const test = require("node:test");
const assert = require("node:assert/strict");

const { policies, limiter } = require("../../services/redis/rateLimits");

test("every named endpoint has a sane rate-limit policy", () => {
  const expected = [
    "authMe",
    "plans",
    "generateQr",
    "paymentConfirm",
    "chat",
    "chatTest",
    "contact",
    "josaaUpdate",
  ];
  for (const name of expected) {
    assert.ok(policies[name], `missing policy: ${name}`);
    assert.ok(policies[name].limit > 0, `limit must be positive: ${name}`);
    assert.ok(policies[name].windowSeconds > 0, `window must be positive: ${name}`);
  }
});

test("limiter factory returns a middleware function", () => {
  const mw = limiter("contact");
  assert.equal(typeof mw, "function");
  assert.equal(mw.length, 3);
});

test("limiter merges overrides", () => {
  const mw = limiter("contact", { limit: 1, windowSeconds: 2 });
  assert.equal(typeof mw, "function");
});
