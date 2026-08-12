const express = require("express");
const { isLoggedIn } = require("../middleware/auth");
const { limiter } = require("../services/redis/rateLimits");

const router = express.Router();

// GET current user (Supabase JWT based)
router.get("/me", limiter("authMe"), isLoggedIn, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.display_name || null,
      createdAt: req.user.created_at || null,
    },
  });
});

module.exports = router;
