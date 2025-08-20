import { rateLimit } from 'express-rate-limit'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_, res) => {
    // logger.emerg(
    //   `${__filename} | Too many requests made to the request: ${req.method} | ${req.originalUrl || req.url || 'unknown path'} | from: ${(req?.user as User)?.code}`
    // )
    res.status(HTTP_STATUS_CODE.TOO_MANY_REQUESTS).json({
      message: 'Too many requests detected, please try again later.'
    })
  }
})
