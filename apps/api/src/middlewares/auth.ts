/**
 * Authentication middleware for JWT token validation
 */

import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { isTokenExpired, isTokenInvalid, verifyToken } from '../utils/jwt.js'
import { sendError, type ErrorSpec } from '../utils/respond.js'

const MISSING_TOKEN: ErrorSpec = {
  status: HTTP_STATUS_CODE.UNAUTHORIZED,
  error: 'authentication_required',
  message: 'please provide a valid jwt token in authorization header'
}

/**
 * Reads the bearer token out of the authorization header
 *
 * @param {string | undefined} authHeader - The raw authorization header
 * @returns {string | null} - The token, or null when the header is absent or malformed
 */
const readBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  return authHeader.split(' ')[1] || null
}

/**
 * Middleware to authenticate JWT tokens from authorization headers
 *
 * A valid signature is not enough on its own. The account is re-read on every
 * request so that deactivating someone takes effect immediately rather than
 * whenever their thirty day token happens to expire, and so the role attached
 * to the request is the current one rather than whatever was true at sign in.
 * That single indexed lookup also serves `adminMiddleware`, which therefore
 * needs no query of its own.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = readBearerToken(req.headers.authorization)

    if (!token) return sendError(res, MISSING_TOKEN)

    const decoded = verifyToken(token)

    const account = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, isActive: true }
    })

    // A deleted or deactivated account is refused the same way a missing token
    // is, so a revoked session cannot tell the two apart.
    if (!account || !account.isActive) {
      return sendError(res, {
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        error: 'account_unavailable',
        message: 'this account is no longer active'
      })
    }

    req.user = { ...decoded, role: account.role }

    return next()
  } catch (error) {
    if (isTokenExpired(error)) {
      return sendError(res, {
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        error: 'token_expired',
        message: 'your session has expired. please login again.'
      })
    }

    if (isTokenInvalid(error)) {
      return sendError(res, {
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        error: 'invalid_token',
        message: 'the provided jwt token is invalid'
      })
    }

    return sendError(res, {
      status: HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
      error: 'authentication_error',
      message: 'an error occurred during authentication'
    })
  }
}
