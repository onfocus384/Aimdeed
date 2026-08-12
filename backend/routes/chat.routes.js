const express = require("express");
const OpenAI = require("openai");
const { isLoggedIn } = require("../middleware/auth");
const { limiter } = require("../services/redis/rateLimits");
const logger = require("../utils/logger");

const router = express.Router();

// ================== CHAT API ==================
const rawKey =
  process.env.GROK_API_KEY ||
  process.env.GROQ_API_KEY ||
  process.env.XAI_API_KEY ||
  process.env.OPENROUTER_API_KEY ||
  "";
const chatApiKey = rawKey.trim();

let provider = "openrouter";
let chatBaseURL = "https://openrouter.ai/api/v1";
let defaultHeaders = {
  "HTTP-Referer": "https://www.aimdeed.in",
  "X-Title": "Aimdeed Chatbot",
};

if (chatApiKey.startsWith("gsk_")) {
  provider = "groq";
  chatBaseURL = "https://api.groq.com/openai/v1";
  defaultHeaders = undefined;
} else if (chatApiKey.startsWith("xai-") || process.env.XAI_API_KEY) {
  provider = "xai";
  chatBaseURL = "https://api.x.ai/v1";
  defaultHeaders = undefined;
}

const openai = new OpenAI({
  apiKey: chatApiKey || "missing",
  baseURL: chatBaseURL,
  defaultHeaders,
});

let CHAT_MODELS = [];
const envModel = process.env.MODEL;

if (provider === "groq") {
  CHAT_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ];
  if (!envModel?.includes("/")) CHAT_MODELS.unshift(envModel);
} else if (provider === "xai") {
  CHAT_MODELS = ["grok-2-latest", "grok-beta", "grok-2-1212"];
  if (envModel?.includes("grok")) CHAT_MODELS.unshift(envModel);
} else {
  CHAT_MODELS = [
    envModel || "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-3-4b-it:free",
  ];
}

const validateChatRequest = (message) => {
  if (!chatApiKey) return "Chatbot configuration error. API key missing.";
  if (!message || !message.trim()) return "Please enter a message.";
  return null;
};

const tryModelRequest = async (model, message) => {
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: message }],
  });
  const reply = completion.choices?.[0]?.message?.content;
  if (!reply) throw new Error("No response from AI model");
  return reply;
};

const fetchAIReply = async (message) => {
  let lastErr = null;
  for (const model of CHAT_MODELS) {
    try {
      console.info(`🤖 Trying model: ${model}`); // kept as-is: dev-facing progress
      return await tryModelRequest(model, message);
    } catch (err) {
      lastErr = err;
      if (err?.status === 429) {
        logger.warn("Rate-limited on model, trying next fallback", { model });
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
};

const getChatErrorReply = (err) => {
  if (err?.status === 429) {
    return "The AI is currently very busy. Please wait a moment and try again.";
  }
  if (err?.status === 401) {
    return "Authentication failed with the AI API. Please update the API key in the configuration.";
  }
  return "I'm having trouble connecting to my brain. Please try again in a moment.";
};

// POST /api/chat
router.post("/chat", limiter("chat"), isLoggedIn, async (req, res) => {
  const { message: userMessage } = req.body;
  const validationError = validateChatRequest(userMessage);
  if (validationError) return res.status(400).json({ reply: validationError });

  try {
    const reply = await fetchAIReply(userMessage);
    return res.json({ reply });
  } catch (err) {
    logger.error("Chat request failed", { err: err.message, status: err?.status });
    return res.status(500).json({ reply: getChatErrorReply(err) });
  }
});

// Debug route — test API directly
router.get("/chat-test", limiter("chatTest"), isLoggedIn, async (req, res) => {
  try {
    const keyPresent = Boolean(chatApiKey);
    const model = CHAT_MODELS[0];

    if (!keyPresent) {
      return res.json({ ok: false, error: "API_KEY not set in environment" });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Say hello in one sentence." }],
    });

    const reply = completion.choices?.[0]?.message?.content;
    return res.json({ ok: true, model, reply, provider });
  } catch (err) {
    return res.json({
      ok: false,
      message: err.message,
      status: err?.status,
      type: err?.type,
      error: err?.error || err?.response?.data,
    });
  }
});

module.exports = router;
