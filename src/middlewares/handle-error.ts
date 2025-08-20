import type { Response, Request, NextFunction } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

const errorHandler = (
  err: Error | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  return res.status(err.status || HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).end()
}

export default errorHandler
