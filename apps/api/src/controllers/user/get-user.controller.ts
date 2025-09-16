/**
 * Controller for retrieving user profiles
 */

import { prisma } from '../../config/database.js'

/**
 * Retrieves user profile by ID or username
 *
 * @param {string} userId - Optional user ID to search by
 * @param {string} username - Optional username to search by
 * @returns {Promise<{id: string, username: string, name: string, joined: string, posts_count: number, replies_count: number, recent_posts: Array<{id: string, content: string, likes: number, created: string}>}|null>} - User profile data or null if not found
 */
const getUserController = async (
  userId?: string | null,
  username?: string
): Promise<{
  id: string
  username: string
  name: string
  joined: string
  posts_count: number
  replies_count: number
  recent_posts: Array<{
    id: string
    content: string
    likes: number
    created: string
  }>
} | null> => {
  let whereClause

  if (!username && !userId) return null
  whereClause = username
    ? ({ username } as { username: string })
    : ({ id: userId! } as { id: string })

  const user = await prisma.user.findUnique({
    where: whereClause,
    include: {
      Post: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: {
        select: {
          Post: true,
          Reply: true
        }
      }
    }
  })

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    joined: user.createdAt.toISOString(),
    posts_count: user._count.Post,
    replies_count: user._count.Reply,
    recent_posts: user.Post.map(
      (post: {
        id: any
        content: any
        likesCount: any
        createdAt: { toISOString: () => string }
      }) => ({
        id: post.id,
        content: post.content,
        likes: post.likesCount,
        created: post.createdAt.toISOString()
      })
    )
  }
}

export default getUserController
