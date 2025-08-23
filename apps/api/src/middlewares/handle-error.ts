import type { Response, Request, NextFunction } from 'express'
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
  return res.status(err.status || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).end()
}

export default errorHandler
