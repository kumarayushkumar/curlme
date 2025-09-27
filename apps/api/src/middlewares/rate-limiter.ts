/**
 * Rate limiting middleware to prevent API abuse
 */

import { rateLimit } from 'express-rate-limit'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'

/**
 * Rate limiting middleware to prevent API abuse
 */
export const limiter = rateLimit({
  windowMs: 1 * 10 * 1000, // 10 seconds
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(
      `too many requests made to the request: ${req.method} | ${req.originalUrl || req.url || 'unknown path'} | from: ${req.ip} | userId: ${req?.user?.userId}`
    )
    return res.status(HTTP_STATUS_CODE.TOO_MANY_REQUESTS).json({
      success: false,
      error: 'too_many_requests',
      message: 'slow down, take it easy'
    })
  }
})
