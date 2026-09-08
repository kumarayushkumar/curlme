import type { Role } from '@prisma/client'

export interface JwtPayload {
  userId: string
  username: string
  /**
   * Present on tokens issued after roles were introduced. The admin guard still
   * reads the role from the database, so a stale token cannot grant access.
   */
  role?: Role
}
