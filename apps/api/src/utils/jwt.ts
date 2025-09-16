/**
 * JWT utility functions for token generation, verification, and error handling
 */

import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/auth.js'
import { JWT_EXPIRE, JWT_SECRET } from './constants.js'

/**
 * Generates a JSON Web Token with the provided payload
 *
 * @param {JwtPayload} payload - User data to encode in the token
 * @returns {string} - A signed JWT string that can be sent to the client
 * @throws {Error} - Throws if JWT_SECRET is not configured or payload is invalid
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

/**
 * Verifies and decodes a JSON Web Token
 *
 * @param {string} token - JWT string to verify
 * @returns {JwtPayload} - Decoded payload
 * @throws {jwt.TokenExpiredError} - When the token has expired
 * @throws {jwt.JsonWebTokenError} - When the token is invalid or malformed
 * @throws {jwt.NotBeforeError} - When the token is not active yet
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

/**
 * Checks if a JWT error is due to token expiration
 *
 * @param {Error | any} error - Error object from token verification
 * @returns {boolean} True if the error is specifically a TokenExpiredError
 */
export const isTokenExpired = (error: Error | any): boolean => {
  return error instanceof jwt.TokenExpiredError
}

/**
 * Checks if a JWT error is due to an invalid token
 *
 * @param {Error | any} error - Error object from token verification
 * @returns {boolean} - True if the error is specifically a JsonWebTokenError
 */
export const isTokenInvalid = (error: Error | any): boolean => {
  return error instanceof jwt.JsonWebTokenError
}
