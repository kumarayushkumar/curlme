/**
 * Controller for registering an account with a username and password
 */

import { prisma } from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'
import { isUniqueConstraintError } from '../../utils/prisma-error.js'
import { err, ok, type Result } from '../../utils/result.js'
import {
  ACCOUNT_SELECT,
  toAccountView,
  type AccountView
} from '../../utils/user-view.js'

export type RegisterError = 'username_taken' | 'unknown_designation'

export type RegisterInput = {
  username: string
  password: string
  name: string
  designation: string
  /** Optional one line description, left null when the account omits it. */
  bio?: string
}

/**
 * Creates a password backed account attached to an existing designation
 *
 * Uniqueness is enforced by the database rather than a prior lookup, so two
 * simultaneous registrations of the same username cannot both succeed.
 *
 * @param {RegisterInput} input - Username, password, display name, designation slug and optional bio
 * @returns {Promise<Result<AccountView, RegisterError>>} - The new account, or why it could not be created
 */
const registerController = async (
  input: RegisterInput
): Promise<Result<AccountView, RegisterError>> => {
  const designation = await prisma.designation.findFirst({
    where: { slug: input.designation, active: true },
    select: { id: true }
  })

  if (!designation) return err('unknown_designation')

  const passwordHash = await hashPassword(input.password)

  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        name: input.name,
        passwordHash,
        designationId: designation.id,
        ...(input.bio === undefined ? {} : { bio: input.bio })
      },
      select: ACCOUNT_SELECT
    })

    return ok(toAccountView(user))
  } catch (error) {
    if (isUniqueConstraintError(error)) return err('username_taken')
    throw error
  }
}

export default registerController
