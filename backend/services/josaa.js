// JOSAA data access + caching.
// The source of truth is backend/data/josaa_data.json; Redis caches the parsed
// ~3 MB payload for 1 hour to avoid repeated disk reads/parsing.
// Cache is invalidated on every PUT (update).

const fs = require("fs");
const path = require("path");
const { cacheService } = require("./redis");
const logger = require("../utils/logger");

const dataPath = path.join(__dirname, "..", "data", "josaa_data.json");

const CACHE_KEY = cacheService.key("josaa", "data");
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

async function getJosaaData() {
  return cacheService.cacheThrough(CACHE_KEY, CACHE_TTL_SECONDS, () => {
    const raw = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(raw);
  });
}

async function setJosaaData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  // Invalidate cache so the next GET re-reads from the file.
  await cacheService.del(CACHE_KEY);
  logger.info("JOSAA data updated and cache invalidated");
}

module.exports = { getJosaaData, setJosaaData, CACHE_KEY, CACHE_TTL_SECONDS, dataPath };
