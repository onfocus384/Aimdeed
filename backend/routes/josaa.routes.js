const express = require("express");
const { limiter } = require("../services/redis/rateLimits");
const { getJosaaData, setJosaaData } = require("../services/josaa");
const logger = require("../utils/logger");

const router = express.Router();

/**
 * GET: Fetch JOSAA college data (cached in Redis for 1h)
 * URL: /api/josaa
 */
router.get("/josaa", async (req, res) => {
  try {
    const jsonData = await getJosaaData();
    return res.status(200).json(jsonData);
  } catch (err) {
    logger.error("Failed to load JOSAA data", { err: err.message });
    return res.status(500).json({ error: "Failed to load JOSAA data" });
  }
});

/**
 * PUT: Update JOSAA data (ADMIN ONLY – recommended)
 * URL: /api/josaa
 */
router.put("/josaa", limiter("josaaUpdate"), async (req, res) => {
  try {
    const newData = req.body;

    if (!Array.isArray(newData)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    await setJosaaData(newData);
    return res.status(200).json({ message: "JOSAA data updated successfully" });
  } catch (err) {
    logger.error("Failed to update JOSAA data", { err: err.message });
    return res.status(500).json({ error: "Failed to update JOSAA data" });
  }
});

module.exports = router;
