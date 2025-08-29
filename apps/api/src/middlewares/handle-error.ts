import type { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'

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
