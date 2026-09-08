/**
 * Controller for deleting replies and associated data
 */

import { prisma } from '../../config/database.js'
import { updatePostInCache } from '../../utils/redis.js'

/**
 * Deletes a reply and associated likes, subtracting the reply's likes from its
 * author's `totalLikesReceived` in the same transaction.
 *
 * @param {string} replyId - The ID of the reply to delete
 * @param {string} userId - The ID of the user requesting deletion
 * @returns {Promise<{id: string}|null>} - Deleted reply ID or null if not found/unauthorized
 */
const deleteReplyController = async (
  replyId: string,
  userId: string
): Promise<{ id: string } | null> => {
  const reply = await prisma.reply.findFirst({ where: { id: replyId, userId } })
  if (!reply) return null

  const postId = reply.postId

  await prisma.$transaction([
    prisma.like.deleteMany({ where: { replyId } }),
    prisma.reply.delete({ where: { id: replyId } }),
    prisma.post.update({
      where: { id: postId },
      data: { repliesCount: { decrement: 1 } }
    }),
    prisma.user.update({
      where: { id: reply.userId },
      data: { totalLikesReceived: { decrement: reply.likesCount } }
    })
  ])

  // Update reply count in cache (-1)
  await updatePostInCache(postId, { replyCountChange: -1 })

  return { id: replyId }
}

export default deleteReplyController
