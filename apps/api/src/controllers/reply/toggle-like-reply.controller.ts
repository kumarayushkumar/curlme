/**
 * Controller for toggling reply likes
 */

import { prisma } from '../../config/database.js'

/**
 * Toggles like/unlike status for a reply. The Like row, the reply's own
 * `likesCount` and the reply author's `totalLikesReceived` all move together in
 * one transaction. A user liking their own reply is allowed and still counts.
 *
 * @param {string} replyId - The ID of the reply to like/unlike
 * @param {string} userId - The ID of the user performing the action
 * @returns {Promise<{message: string}|null>} - Updated like status or null if reply not found
 */
const toggleLikeReplyController = async (
  replyId: string,
  userId: string
): Promise<{ message: string } | null> => {
  const reply = await prisma.reply.findUnique({
    where: { id: replyId },
    select: { userId: true }
  })

  if (!reply) return null

  // Check if user already liked this reply
  const existingLike = await prisma.like.findUnique({
    where: {
      unique_user_reply_like: {
        userId: userId,
        replyId: replyId
      }
    }
  })

  const delta = existingLike ? -1 : 1
  const action = existingLike ? 'unliked' : 'liked'

  const likeWrite = existingLike
    ? prisma.like.delete({ where: { id: existingLike.id } })
    : prisma.like.create({ data: { userId: userId, replyId: replyId } })

  await prisma.$transaction([
    likeWrite,
    prisma.reply.update({
      where: { id: replyId },
      data: { likesCount: { increment: delta } }
    }),
    prisma.user.update({
      where: { id: reply.userId },
      data: { totalLikesReceived: { increment: delta } }
    })
  ])

  return {
    message: `Reply ${action} successfully`
  }
}

export default toggleLikeReplyController
