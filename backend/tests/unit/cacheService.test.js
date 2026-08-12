const test = require("node:test");
const assert = require("node:assert/strict");

const CacheService = require("../../services/redis/cacheService");

// In-memory fake implementing the ioredis surface the cache uses.
function makeFakeClient() {
  const store = new Map();
  return {
    store,
    async get(key) {
      const v = store.get(key);
      return v === undefined ? null : v;
    },
    async set(key, value, ...rest) {
      store.set(key, value);
      return "OK";
    },
    async del(...keys) {
      keys.forEach((k) => store.delete(k));
      return keys.length;
    },
    async scan(cursor, ...args) {
      const pattern = args[args.indexOf("MATCH") + 1];
      const count = args[args.indexOf("COUNT") + 1];
      const re = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      const keys = [...store.keys()].filter((k) => re.test(k)).slice(0, count || 100);
      return ["0", keys];
    },
    async ping() {
      return "PONG";
    },
  };
}

test("set/get roundtrip with JSON", async () => {
  const c = new CacheService(makeFakeClient(), { prefix: "t" });
  await c.set("t:user:1", { name: "Ada" }, 60);
  assert.deepEqual(await c.get("t:user:1"), { name: "Ada" });
});

test("get returns null on miss", async () => {
  const c = new CacheService(makeFakeClient(), { prefix: "t" });
  assert.equal(await c.get("t:nope"), null);
});

test("get returns raw string when not JSON", async () => {
  const client = makeFakeClient();
  const c = new CacheService(client, { prefix: "t" });
  client.store.set("t:raw", "hello");
  assert.equal(await c.get("t:raw"), "hello");
});

test("disabled cache never touches client and returns null", async () => {
  let called = 0;
  const client = {
    async get() {
      called++;
      return "x";
    },
  };
  const c = new CacheService(client, { enabled: false });
  assert.equal(await c.get("any"), null);
  assert.equal(called, 0);
});

test("get fails open when client throws", async () => {
  const client = {
    async get() {
      throw new Error("redis down");
    },
  };
  const c = new CacheService(client, { enabled: true });
  assert.equal(await c.get("any"), null);
});

test("set fails open when client throws", async () => {
  const client = {
    async set() {
      throw new Error("redis down");
    },
  };
  const c = new CacheService(client, { enabled: true });
  assert.equal(await c.set("any", "v"), false);
});

test("cacheThrough caches on miss, serves from cache on hit", async () => {
  const c = new CacheService(makeFakeClient(), { prefix: "t" });
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { n: calls };
  };

  const first = await c.cacheThrough("t:key", 60, fetcher);
  assert.equal(first.n, 1);

  const second = await c.cacheThrough("t:key", 60, fetcher);
  assert.equal(second.n, 1); // still cached
  assert.equal(calls, 1);
});

test("delByPrefix deletes matching keys via scan", async () => {
  const client = makeFakeClient();
  const c = new CacheService(client, { prefix: "aimdeed-test" });
  await c.set("aimdeed-test:a:1", 1);
  await c.set("aimdeed-test:a:2", 2);
  await c.set("aimdeed-test:b:3", 3);
  await c.delByPrefix("aimdeed-test:a:");
  assert.equal(await c.get("aimdeed-test:a:1"), null);
  assert.equal(await c.get("aimdeed-test:a:2"), null);
  assert.notEqual(await c.get("aimdeed-test:b:3"), null);
});
