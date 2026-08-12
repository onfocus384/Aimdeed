const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabaseAdmin = null;

try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
} catch (err) {
  logger.error("Failed to create Supabase client", { err: err.message });
}

if (!supabaseAdmin) {
  logger.warn(
    "Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. DB/Auth-dependent routes will fail until configured.",
  );
}

module.exports = { supabaseAdmin };
