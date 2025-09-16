/**
 * Global error handling middleware for Express application
 */

import type { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'

/**
 * Global error handler middleware for Express application
 *
 * @param {Error} err - Error object
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (unused)
 */
const errorHandler = (
  err: Error | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(
    `${err.message}, error code: ${err.code || ''}, error stack: ${err.stack || ''} `,
    err
  )

  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  return res.status(err.status || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack })
  })
}

export default errorHandler
