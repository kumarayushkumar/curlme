/**
 * Authentication middleware for JWT token validation
 */

import type { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { isTokenExpired, isTokenInvalid, verifyToken } from '../utils/jwt.js'

/**
 * Middleware to authenticate JWT tokens from authorization headers
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'authentication required',
        message: 'please provide a valid jwt token in authorization header'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'authentication required',
        message: 'please provide a valid jwt token in authorization header'
      })
    }

    const decoded = verifyToken(token)
    req.user = decoded

    next()
  } catch (error) {
    if (isTokenExpired(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'token expired',
        message: 'your session has expired. please login again.'
      })
    }

    if (isTokenInvalid(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'invalid token',
        message: 'the provided jwt token is invalid'
      })
    }

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'authentication error',
      message: 'An error occurred during authentication'
    })
  }
}
