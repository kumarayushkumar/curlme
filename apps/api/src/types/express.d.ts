import type { JwtPayload } from './auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }

    interface Response {
      user?: JwtPayload
    }
  }
}
