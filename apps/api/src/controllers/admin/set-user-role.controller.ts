/**
 * Controller for promoting or demoting an account
 */

import type { Role } from '@prisma/client'
import { prisma } from '../../config/database.js'
import { err, ok, type Result } from '../../utils/result.js'

export type SetUserRoleError = 'user_not_found' | 'self_demotion'

export type RoleChange = {
  username: string
  previous_role: Role
  role: Role
}

/**
 * Changes the role of an account
 *
 * An admin cannot demote themselves, which removes the easiest way to leave the
 * platform with no administrator at all.
 *
 * @param {string} actingUserId - The admin performing the change
 * @param {string} targetUsername - The account being changed
 * @param {Role} role - The role to apply
 * @returns {Promise<Result<RoleChange, SetUserRoleError>>} - The applied change, or why it was refused
 */
const setUserRoleController = async (
  actingUserId: string,
  targetUsername: string,
  role: Role
): Promise<Result<RoleChange, SetUserRoleError>> => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true, username: true, role: true }
  })

  if (!target) return err('user_not_found')
  if (target.id === actingUserId && role !== 'ADMIN')
    return err('self_demotion')

  if (target.role === role) {
    return ok({
      username: target.username,
      previous_role: target.role,
      role
    })
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role },
    select: { username: true, role: true }
  })

  return ok({
    username: updated.username,
    previous_role: target.role,
    role: updated.role
  })
}

export default setUserRoleController
