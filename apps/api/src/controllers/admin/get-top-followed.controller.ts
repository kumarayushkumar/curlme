/**
 * Controller for ranking users by follower count
 */

import { prisma } from '../../config/database.js'

export type TopFollowedUser = {
  rank: number
  username: string
  name: string
  designation: string | null
  role: string
  follower_count: number
  following_count: number
  post_count: number
  total_likes_received: number
  joined: string
}

/**
 * Ranks the most followed accounts
 *
 * Reads the denormalised `followerCount`, which is indexed, so the ranking
 * stays a single indexed scan rather than an aggregate over the Follow table.
 * `postCount` is read the same way instead of counting the Post relation, which
 * keeps the query free of a correlated subquery per row.
 *
 * @param {number} limit - How many accounts to return
 * @returns {Promise<TopFollowedUser[]>} - Active accounts ordered by follower count, highest first
 */
const getTopFollowedController = async (
  limit: number
): Promise<TopFollowedUser[]> => {
  const users = await prisma.user.findMany({
    where: { isActive: true, followerCount: { gt: 0 } },
    orderBy: [{ followerCount: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      username: true,
      name: true,
      role: true,
      followerCount: true,
      followingCount: true,
      postCount: true,
      totalLikesReceived: true,
      createdAt: true,
      designation: { select: { label: true } }
    }
  })

  return users.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    name: user.name,
    designation: user.designation?.label ?? null,
    role: user.role,
    follower_count: user.followerCount,
    following_count: user.followingCount,
    post_count: user.postCount,
    total_likes_received: user.totalLikesReceived,
    joined: user.createdAt.toISOString()
  }))
}

export default getTopFollowedController
