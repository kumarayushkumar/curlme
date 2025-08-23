import { Redis } from 'ioredis'
import { REDIS_HOST, REDIS_PORT } from '../utils/constants.js'
import { logger } from '../utils/logger.js';

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  maxRetriesPerRequest: null, // Disable retries for failed requests
  reconnectOnError: (err: any) => {
    logger.error("Redis connection error:", err.message);
    return true // Attempt reconnect on error
  },
  retryStrategy: (times: number) => {
    logger.error(`Retrying Redis connection attempt #${times}`);
    // Return time in ms to retry, or null to stop retrying
    return Math.min(times * 100, 3000)
  }
})

redisConnection.on('connect', () => {
  logger.info("Connected to Redis successfully");
})

redisConnection.on('error', err => {
  logger.error("Redis error:", err.message);
})

redisConnection.on('end', () => {
  logger.info("Redis connection has closed");
});
