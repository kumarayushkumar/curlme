/**
 * Controller for toggling reply likes
 */

import { prisma } from '../../config/database.js'

/**
 * Toggles like/unlike status for a reply
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
    include: { likes: true }
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

  let action: 'liked' | 'unliked'

  if (existingLike) {
    // Unlike: Remove like and decrement count
    await prisma.$transaction([
      prisma.like.delete({
        where: { id: existingLike.id }
      }),
      prisma.reply.update({
        where: { id: replyId },
        data: { likesCount: { decrement: 1 } }
      })
    ])

    action = 'unliked'
  } else {
    // Like: Add like and increment count
    await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: userId,
          replyId: replyId
        }
      }),
      prisma.reply.update({
        where: { id: replyId },
        data: { likesCount: { increment: 1 } }
      })
    ])

    action = 'liked'
  }

  return {
    message: `Reply ${action} successfully`
  }
}

export default toggleLikeReplyController
