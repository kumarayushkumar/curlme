/**
 * Authorisation middleware restricting a route to accounts with the ADMIN role
 */

import type { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'
import { sendError } from '../utils/respond.js'

/**
 * Middleware that allows the request through only for admin accounts.
 *
 * `authMiddleware` has already re-read the account and attached its current
 * role, and refuses inactive accounts outright, so this guard is a plain check
 * with no second query. Revoking an admin still takes effect immediately.
 *
 * Must run after `authMiddleware`.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user

  if (!user) {
    return sendError(res, {
      status: HTTP_STATUS_CODE.UNAUTHORIZED,
      error: 'authentication_required',
      message: 'please provide a valid jwt token in authorization header'
    })
  }

  if (user.role !== 'ADMIN') {
    logger.error(
      `non admin userId: ${user.userId} attempted ${req.originalUrl}`
    )
    return sendError(res, {
      status: HTTP_STATUS_CODE.FORBIDDEN,
      error: 'forbidden',
      message: 'this endpoint is restricted to admin accounts'
    })
  }

  return next()
}
