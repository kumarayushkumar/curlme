/**
 * Controller for creating new posts
 */

import { prisma } from '../../config/database.js'
import { cachePost } from '../../utils/redis.js'

/**
 * Creates a new post for a user and increments the author's post counter in
 * the same transaction, so `User.postCount` can never drift from the rows it
 * summarises.
 *
 * @param {string} content - The post content
 * @param {string} userId - The ID of the user creating the post
 * @returns {Promise<{postId: string, content: string, createdAt: string}|null>} - Post data or null if creation failed
 */
const createPostController = async (
  content: string,
  userId: string
): Promise<{ postId: string; content: string; createdAt: string } | null> => {
  const post = await prisma.$transaction(async tx => {
    const created = await tx.post.create({
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

    await tx.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } }
    })

    return created
  })

  // Cache the new post (it will have 0 replies since it's new)
  await cachePost(post)

  return {
    postId: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString()
  }
}

export default createPostController
