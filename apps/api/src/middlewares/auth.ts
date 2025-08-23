import type { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { isTokenExpired, isTokenInvalid, verifyToken } from '../utils/jwt.js'

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
        error: 'Authentication required',
        message: 'Please provide a valid JWT token in Authorization header'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid JWT token in Authorization header'
      })
    }

    const decoded = verifyToken(token)
    req.user = decoded

    next()
  } catch (error) {
    if (isTokenExpired(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      })
    }

    if (isTokenInvalid(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided JWT token is invalid'
      })
    }

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    })
  }
}
