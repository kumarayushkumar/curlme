/**
 * Controller for creating replies to posts
 */

import { prisma } from '../../config/database.js'
import { updatePostInCache } from '../../utils/redis.js'

/**
 * Creates a new reply to a post
 *
 * @param {string} content - The reply content
 * @param {string} userId - The ID of the user creating the reply
 * @param {string} postId - The ID of the post being replied to
 * @returns {Promise<{replyId: string, content: string, createdAt: string}|null>} - Reply data or null if post not found
 */
const createReplyController = async (
  content: string,
  userId: string,
  postId: string
): Promise<{ replyId: string; content: string; createdAt: string } | null> => {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) return null

  const [reply] = await prisma.$transaction([
    prisma.reply.create({
      data: {
        content,
        userId: userId,
        postId: postId
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    }),
    prisma.post.update({
      where: { id: postId },
      data: { repliesCount: { increment: 1 } }
    })
  ])

  if (!reply) return null

  // Update reply count in cache (+1)
  await updatePostInCache(postId, { replyCountChange: 1 })

  return {
    replyId: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString()
  }
}

export default createReplyController
