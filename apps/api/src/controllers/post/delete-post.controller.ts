/**
 * Controller for deleting posts and associated data
 */

import { prisma } from '../../config/database.js'
import type { CachedPost } from '../../types/post.js'
import { logger } from '../../utils/logger.js'
import { getPostsFromCache, setPostsInCache } from '../../utils/redis.js'

/** A reply row read purely to work out whose like counters have to move. */
type ReplyLikeRow = { userId: string; likesCount: number }

/**
 * Sums the likes of the replies being deleted per reply author. Replies on a
 * post can belong to anyone, so every distinct author gets exactly one entry.
 * Authors whose total is zero are dropped, since writing a no-op update for
 * them is pure cost.
 *
 * @param {ReplyLikeRow[]} replies - The replies about to be deleted
 * @returns {Map<string, number>} - Likes to subtract, keyed by reply author ID
 */
const sumLikesByAuthor = (replies: ReplyLikeRow[]): Map<string, number> => {
  const totals = new Map<string, number>()

  for (const { userId, likesCount } of replies) {
    totals.set(userId, (totals.get(userId) ?? 0) + likesCount)
  }

  return new Map([...totals].filter(([, total]) => total !== 0))
}

/**
 * Deletes a post and all associated data (replies, likes), keeping the
 * denormalised user counters exact in the same transaction: the post author
 * loses one from `postCount` and the post's likes from `totalLikesReceived`,
 * and every author of a deleted reply loses that reply's likes too.
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
    const replies = await tx.reply.findMany({
      where: { postId },
      select: { id: true, userId: true, likesCount: true }
    })

    await tx.reply.deleteMany({ where: { postId } })
    await tx.like.deleteMany({ where: { postId } })
    await tx.post.delete({ where: { id: postId } })

    await tx.user.update({
      where: { id: post.userId },
      data: {
        postCount: { decrement: 1 },
        totalLikesReceived: { decrement: post.likesCount }
      }
    })

    for (const [authorId, likes] of sumLikesByAuthor(replies)) {
      await tx.user.update({
        where: { id: authorId },
        data: { totalLikesReceived: { decrement: likes } }
      })
    }
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
