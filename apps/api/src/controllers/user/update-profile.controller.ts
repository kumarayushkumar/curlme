/**
 * Controller for editing your own profile
 */

import { prisma } from '../../config/database.js'
import {
  ACCOUNT_SELECT,
  toAccountView,
  type AccountView
} from '../../utils/user-view.js'

/**
 * Updates the signed in user's bio
 *
 * An empty string clears the bio rather than storing a blank one, so the
 * profile renders as "not set" instead of an empty line.
 *
 * @param {string} userId - The account being edited
 * @param {string} bio - The new bio, already trimmed by the validator
 * @returns {Promise<AccountView>} - The updated account
 */
const updateProfileController = async (
  userId: string,
  bio: string
): Promise<AccountView> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { bio: bio.length > 0 ? bio : null },
    select: ACCOUNT_SELECT
  })

  return toAccountView(user)
}

export default updateProfileController
