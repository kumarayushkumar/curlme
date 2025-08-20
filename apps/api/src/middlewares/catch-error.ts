import type { Response, Request, NextFunction } from 'express'

export function catchError(handler: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
