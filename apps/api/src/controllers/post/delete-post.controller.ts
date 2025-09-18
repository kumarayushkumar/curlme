/**
 * Controller for deleting posts and associated data
 */

import { prisma } from '../../config/database.js'
import type { CachedPost } from '../../types/post.js'
import { logger } from '../../utils/logger.js'
import { getPostsFromCache, setPostsInCache } from '../../utils/redis.js'

/**
 * Deletes a post and all associated data (replies, likes)
 *
 * @param {string} postId - The ID of the post to delete
 * @param {string} userId - The ID of the user requesting deletion
 * @returns {Promise<{id: string}|null>} - Deleted post ID or null if not found/unauthorized
 */
const deletePostController = async (
  postId: string,
  userId: string
): Promise<{ id: string } | null> => {
  const post = await prisma.post.findFirst({ where: { id: postId, userId } })
  if (!post) return null

  await prisma.$transaction(async tx => {
    await tx.reply.deleteMany({ where: { postId } })
    await tx.like.deleteMany({ where: { postId } })
    await tx.post.delete({ where: { id: postId } })
  })

  // Invalidate cache after post deletion
  try {
    const cachedPosts = await getPostsFromCache()
    if (cachedPosts) {
      await setPostsInCache(
        cachedPosts.filter((post: CachedPost) => post.id !== postId)
      )
    }
  } catch (error) {
    logger.error(`failed to invalidate cache after post deletion: ${error}`)
  }

  return { id: postId }
}

export default deletePostController
