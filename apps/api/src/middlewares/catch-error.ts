/**
 * Error catching middleware for async route handlers
 */

import type { NextFunction, Request, Response } from 'express'

/**
 * Middleware to catch errors in async route handlers and pass them to Express error handler
 *
 * @param {(req: Request, res: Response, next: NextFunction) => Promise<any>} handler - Async route handler function to wrap
 */
export function catchError(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
