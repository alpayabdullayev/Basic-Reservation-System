const redis = require("redis");
const logger = require("../utils/logger");


const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
  logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.log("'Redis connection error', err");

  logger.error("Redis connection error", err);
});

redisClient.connect();

module.exports = redisClient;
