const { supabaseAdmin } = require("../config/supabase");
const logger = require("../utils/logger");

const extractToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};

const getUserFromToken = async (token) => {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
};

const enrichWithProfile = async (authUser) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profile) return profile;

  return {
    id: authUser.id,
    username:
      authUser.user_metadata?.username || authUser.email?.split("@")[0] || "user",
    email: authUser.email,
    display_name: authUser.user_metadata?.full_name || null,
  };
};

const isLoggedIn = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Please login first!" });
    }

    const authUser = await getUserFromToken(token);
    if (!authUser) {
      return res.status(401).json({ error: "Invalid or expired session. Please login again." });
    }

    req.user = await enrichWithProfile(authUser);
    return next();
  } catch (err) {
    logger.error("Auth middleware error", { err: err.message });
    return res.status(500).json({ error: "Authentication error" });
  }
};

const isLoggedOut = (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    return res.status(400).json({ error: "You are already logged in!" });
  }
  return next();
};

module.exports = { isLoggedIn, isLoggedOut };
