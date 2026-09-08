/**
 * Controller for unfollowing another user
 */

import { prisma } from '../../config/database.js'
import { err, ok, type Result } from '../../utils/result.js'

export type UnfollowError = 'user_not_found' | 'not_following'

export type UnfollowResult = {
  username: string
  follower_count: number
}

/**
 * Removes the follow edge from the current user to the named user
 *
 * The delete reports how many rows it removed, so the counters are only
 * adjusted when an edge actually existed.
 *
 * A soft deleted target reports the same `user_not_found` failure as one that
 * never existed, so deactivated accounts stay indistinguishable from missing
 * ones.
 *
 * @param {string} followerId - The ID of the user doing the unfollowing
 * @param {string} targetUsername - The username being unfollowed
 * @returns {Promise<Result<UnfollowResult, UnfollowError>>} - Updated follower count, or why it failed
 */
const unfollowUserController = async (
  followerId: string,
  targetUsername: string
): Promise<Result<UnfollowResult, UnfollowError>> => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true, username: true, isActive: true }
  })

  if (!target || !target.isActive) return err('user_not_found')

  const followerCount = await prisma.$transaction(async tx => {
    const deleted = await tx.follow.deleteMany({
      where: { followerId, followingId: target.id }
    })

    if (deleted.count === 0) return null

    const unfollowed = await tx.user.update({
      where: { id: target.id },
      data: { followerCount: { decrement: 1 } },
      select: { followerCount: true }
    })

    await tx.user.update({
      where: { id: followerId },
      data: { followingCount: { decrement: 1 } }
    })

    return unfollowed.followerCount
  })

  if (followerCount === null) return err('not_following')

  return ok({ username: target.username, follower_count: followerCount })
}

export default unfollowUserController
