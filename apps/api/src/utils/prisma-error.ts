/**
 * Helpers for interpreting Prisma error codes
 */

import { Prisma } from '@prisma/client'

/**
 * Detects the "unique constraint failed" error, which is how a race between two
 * concurrent writes to the same unique key surfaces.
 *
 * @param {unknown} error - Error thrown by a Prisma query
 * @returns {boolean} - True when the write lost a uniqueness race
 */
export const isUniqueConstraintError = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}
