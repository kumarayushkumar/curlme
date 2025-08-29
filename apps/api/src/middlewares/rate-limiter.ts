import { rateLimit } from 'express-rate-limit'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(
      `${__filename} | too many requests made to the request: ${req.method} | ${req.originalUrl || req.url || 'unknown path'} | from: ${req?.user?.userId}`
    )
    res.status(HTTP_STATUS_CODE.TOO_MANY_REQUESTS).json({
      success: false,
      error: 'too many requests',
      message: 'slow down, take it easy'
    })
  }
})
