const test = require("node:test");
const assert = require("node:assert/strict");

const RateLimitService = require("../../services/redis/rateLimitService");

function makeFakeClient(counter) {
  return {
    multi() {
      const self = this;
      return {
        incr(key) {
          self._incrKey = key;
          return this;
        },
        expire(key, secs) {
          return this;
        },
        async exec() {
          counter.n += 1;
          return [[null, counter.n]];
        },
      };
    },
  };
}

test("allows requests under the limit", async () => {
  const counter = { n: 0 };
  const rl = new RateLimitService(makeFakeClient(counter), { enabled: true });
  const r = await rl.hit("k", { limit: 5, windowSeconds: 60 });
  assert.equal(r.allowed, true);
  assert.equal(r.remaining, 4);
});

test("blocks when count exceeds limit", async () => {
  const counter = { n: 6 };
  const rl = new RateLimitService(makeFakeClient(counter), { enabled: true });
  const r = await rl.hit("k", { limit: 5, windowSeconds: 60 });
  assert.equal(r.allowed, false);
  assert.equal(r.remaining, 0);
});

test("fails open when redis errors", async () => {
  const client = {
    multi() {
      throw new Error("redis down");
    },
  };
  const rl = new RateLimitService(client, { enabled: true });
  const r = await rl.hit("k", { limit: 5, windowSeconds: 60 });
  assert.equal(r.allowed, true);
});

test("disabled service always allows", async () => {
  let called = false;
  const client = {
    async multi() {
      called = true;
    },
  };
  const rl = new RateLimitService(client, { enabled: false });
  const r = await rl.hit("k", { limit: 1, windowSeconds: 60 });
  assert.equal(r.allowed, true);
  assert.equal(called, false);
});

test("middleware rejects with 429 and Retry-After when blocked", async () => {
  const counter = { n: 10 };
  const rl = new RateLimitService(makeFakeClient(counter), { enabled: true });
  const mw = rl.middleware({ limit: 5, windowSeconds: 60, key: "rl:test" });

  const req = { ip: "1.2.3.4", user: null };
  const res = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await mw(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.code, 429);
  assert.equal(res.headers["Retry-After"], "60");
  assert.match(res.body.error, /Too many requests/);
});

test("middleware calls next when allowed", async () => {
  const counter = { n: 0 };
  const rl = new RateLimitService(makeFakeClient(counter), { enabled: true });
  const mw = rl.middleware({ limit: 5, windowSeconds: 60, key: "rl:test" });

  let passed = false;
  await mw({ ip: "1.2.3.4", user: null }, { setHeader() {} }, () => {
    passed = true;
  });
  assert.equal(passed, true);
});
