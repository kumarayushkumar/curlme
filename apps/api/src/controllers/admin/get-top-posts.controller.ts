/**
 * Controller for ranking posts by likes received
 */

import { prisma } from '../../config/database.js'

export type TopPost = {
  rank: number
  id: string
  username: string
  content: string
  likes_count: number
  replies_count: number
  created_at: string
}

/**
 * Ranks the most liked posts
 *
 * Posts by deactivated accounts are left out: the content is still there, but a
 * soft deleted account is not meant to surface in a leaderboard.
 *
 * @param {number} limit - How many posts to return
 * @returns {Promise<TopPost[]>} - Posts by active authors, ordered by like count, highest first
 */
const getTopPostsController = async (limit: number): Promise<TopPost[]> => {
  const posts = await prisma.post.findMany({
    where: { user: { isActive: true } },
    orderBy: [
      { likesCount: 'desc' },
      { repliesCount: 'desc' },
      { createdAt: 'desc' }
    ],
    take: limit,
    select: {
      id: true,
      content: true,
      likesCount: true,
      repliesCount: true,
      createdAt: true,
      user: { select: { username: true } }
    }
  })

  return posts.map((post, index) => ({
    rank: index + 1,
    id: post.id,
    username: post.user.username,
    content: post.content,
    likes_count: post.likesCount,
    replies_count: post.repliesCount,
    created_at: post.createdAt.toISOString()
  }))
}

export default getTopPostsController
