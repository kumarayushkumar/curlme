/**
 * Controller for soft deleting and restoring an account
 */

import { prisma } from '../../config/database.js'
import { err, ok, type Result } from '../../utils/result.js'

export type SetUserActiveError = 'user_not_found' | 'self_deactivation'

export type ActiveChange = {
  username: string
  is_active: boolean
}

/**
 * Activates or deactivates an account
 *
 * Deactivating is a soft delete: the row stays, the username stays reserved and
 * the content stays put, the account just stops being able to sign in and
 * disappears from listings. An admin cannot deactivate themselves, which is the
 * same guard the role change uses to keep at least one admin reachable.
 *
 * The write is skipped when the account already holds the requested state, so
 * repeating the request is a no-op rather than a pointless update.
 *
 * @param {string} actingUserId - The admin performing the change
 * @param {string} targetUsername - The account being changed
 * @param {boolean} isActive - The state to apply
 * @returns {Promise<Result<ActiveChange, SetUserActiveError>>} - The applied state, or why it was refused
 */
const setUserActiveController = async (
  actingUserId: string,
  targetUsername: string,
  isActive: boolean
): Promise<Result<ActiveChange, SetUserActiveError>> => {
  // Deliberately not filtered by `isActive`: reactivating an account has to be
  // able to find the deactivated row.
  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true, username: true, isActive: true }
  })

  if (!target) return err('user_not_found')
  if (target.id === actingUserId && !isActive) return err('self_deactivation')

  if (target.isActive === isActive) {
    return ok({ username: target.username, is_active: target.isActive })
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { isActive },
    select: { username: true, isActive: true }
  })

  return ok({ username: updated.username, is_active: updated.isActive })
}

export default setUserActiveController
