const test = require("node:test");
const assert = require("node:assert/strict");

const { AppError, notFound, errorHandler } = require("../../middleware/errorHandler");

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

test("AppError carries status and code", () => {
  const err = new AppError(429, "Slow down", "rate_limited");
  assert.equal(err.status, 429);
  assert.equal(err.code, "rate_limited");
  assert.equal(err.message, "Slow down");
});

test("notFound returns 404 json", () => {
  const res = mockRes();
  notFound({}, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Not found" });
});

test("errorHandler hides internals for 5xx", () => {
  const res = mockRes();
  const err = new Error("secret stack detail: db password leak");
  err.status = 500;
  errorHandler(err, { id: "r1" }, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Internal server error" });
});

test("errorHandler surfaces message for 4xx", () => {
  const res = mockRes();
  const err = new AppError(400, "Invalid amount", "invalid_input");
  errorHandler(err, { id: "r1" }, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid amount", code: "invalid_input" });
});
