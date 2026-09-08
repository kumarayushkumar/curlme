/**
 * Controller for following another user
 */

import { prisma } from '../../config/database.js'
import { err, ok, type Result } from '../../utils/result.js'

export type FollowError = 'user_not_found' | 'self_follow' | 'already_following'

export type FollowResult = {
  username: string
  follower_count: number
}

/**
 * Creates a follow edge from the current user to the named user
 *
 * The edge and both denormalised counters are written in one transaction, and
 * the insert relies on the unique constraint via `skipDuplicates`, so two
 * concurrent follows cannot double count.
 *
 * A soft deleted target reports the same `user_not_found` failure as one that
 * never existed, so deactivated accounts stay indistinguishable from missing
 * ones.
 *
 * @param {string} followerId - The ID of the user doing the following
 * @param {string} targetUsername - The username being followed
 * @returns {Promise<Result<FollowResult, FollowError>>} - Updated follower count, or why it failed
 */
const followUserController = async (
  followerId: string,
  targetUsername: string
): Promise<Result<FollowResult, FollowError>> => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true, username: true, isActive: true }
  })

  if (!target || !target.isActive) return err('user_not_found')
  if (target.id === followerId) return err('self_follow')

  const followerCount = await prisma.$transaction(async tx => {
    const created = await tx.follow.createMany({
      data: [{ followerId, followingId: target.id }],
      skipDuplicates: true
    })

    if (created.count === 0) return null

    const followed = await tx.user.update({
      where: { id: target.id },
      data: { followerCount: { increment: 1 } },
      select: { followerCount: true }
    })

    await tx.user.update({
      where: { id: followerId },
      data: { followingCount: { increment: 1 } }
    })

    return followed.followerCount
  })

  if (followerCount === null) return err('already_following')

  return ok({ username: target.username, follower_count: followerCount })
}

export default followUserController
