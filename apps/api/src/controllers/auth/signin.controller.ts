/**
 * Controller for authenticating an account with a username and password
 */

import { prisma } from '../../config/database.js'
import { verifyPassword } from '../../utils/password.js'
import { err, ok, type Result } from '../../utils/result.js'
import {
  ACCOUNT_SELECT,
  toAccountView,
  type AccountView
} from '../../utils/user-view.js'

export type SigninError = 'invalid_credentials'

/**
 * Verifies a username and password pair
 *
 * A missing account, a soft deleted account and a wrong password all produce
 * the same error after the same amount of work, so neither the response nor
 * its timing reveals which usernames are registered or still active. The
 * bcrypt comparison therefore runs before the account is inspected, relying on
 * `verifyPassword` comparing against a dummy digest when there is none.
 *
 * @param {string} username - The account username
 * @param {string} password - The plaintext password to verify
 * @returns {Promise<Result<AccountView, SigninError>>} - The account, or a credential failure
 */
const signinController = async (
  username: string,
  password: string
): Promise<Result<AccountView, SigninError>> => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { ...ACCOUNT_SELECT, passwordHash: true }
  })

  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? null
  )

  if (!user || !passwordMatches || !user.isActive) {
    return err('invalid_credentials')
  }

  return ok(toAccountView(user))
}

export default signinController
