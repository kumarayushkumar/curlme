/**
 * Controller for creating new posts
 */

import { prisma } from '../../config/database.js'
import { cachePost } from '../../utils/redis.js'

/**
 * Creates a new post for a user
 *
 * @param {string} content - The post content
 * @param {string} userId - The ID of the user creating the post
 * @returns {Promise<{postId: string, content: string, createdAt: string}|null>} - Post data or null if creation failed
 */
const createPostController = async (
  content: string,
  userId: string
): Promise<{ postId: string; content: string; createdAt: string } | null> => {
  const post = await prisma.post.create({
    data: {
      content,
      userId: userId
    },
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!post) return null

  // Cache the new post (it will have 0 replies since it's new)
  await cachePost(post)

  return {
    postId: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString()
  }
}

export default createPostController
