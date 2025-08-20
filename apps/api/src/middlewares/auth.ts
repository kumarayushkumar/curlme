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
        error: 'Authentication required',
        message: 'Please provide a valid JWT token in Authorization header',
        example: 'Authorization: Bearer <your-token>'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        error: 'Authentication required',
        message: 'Please provide a valid JWT token in Authorization header',
        example: 'Authorization: Bearer <your-token>'
      })
    }

    const decoded = verifyToken(token)
    req.user = decoded

    next()
  } catch (error) {
    if (isTokenExpired(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
        action:
          'curl -X POST http://localhost:8000/login -H "Content-Type: application/json"'
      })
    }

    if (isTokenInvalid(error)) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        error: 'Invalid token',
        message: 'The provided JWT token is invalid'
      })
    }

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    })
  }
}
