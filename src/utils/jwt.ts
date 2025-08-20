import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/auth.js'
import { JWT_EXPIRE, JWT_SECRET } from './constants.js'

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export const isTokenExpired = (error: any): boolean => {
  return error instanceof jwt.TokenExpiredError
}

export const isTokenInvalid = (error: any): boolean => {
  return error instanceof jwt.JsonWebTokenError
}
