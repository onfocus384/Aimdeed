import { getAccessToken } from "../lib/supabase";

const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  me: () => request("/auth/me"),

  // Payment
  paymentPlans: () => request("/payment/plans"),
  generateQR: (amount) =>
    request("/payment/generate-qr", { method: "POST", body: JSON.stringify({ amount }) }),
  confirmPayment: (payload) =>
    request("/payment/confirm", { method: "POST", body: JSON.stringify(payload) }),

  // Chat
  chat: (message) =>
    request("/chat", { method: "POST", body: JSON.stringify({ message }) }),

  // JOSAA
  josaa: () => request("/josaa"),

  // Contact
  contact: (payload) =>
    request("/contact", { method: "POST", body: JSON.stringify(payload) }),
};
