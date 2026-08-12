// Named rate-limit policies, enforced per IP (and per user when authenticated).
// Values are per-backend-instance; Nginx enforces a shared global budget in front.

const { rateLimitService } = require("./index");

const policies = {
  authMe: { limit: 60, windowSeconds: 60 },
  plans: { limit: 60, windowSeconds: 60 },
  generateQr: { limit: 20, windowSeconds: 60 },
  paymentConfirm: { limit: 10, windowSeconds: 60 },
  chat: { limit: 30, windowSeconds: 60 },
  chatTest: { limit: 5, windowSeconds: 60 },
  contact: { limit: 5, windowSeconds: 60 },
  josaaUpdate: { limit: 10, windowSeconds: 3600 },
};

function limiter(name, overrides = {}) {
  const policy = { ...policies[name], ...overrides };
  return rateLimitService.middleware({
    ...policy,
    key: `rl:${name}`,
  });
}

module.exports = { limiter, policies };
