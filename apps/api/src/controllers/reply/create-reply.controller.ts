import { prisma } from '../../config/database.js'
import { updatePostInCache } from '../../utils/redis.js'

const createReplyController = async (
  content: string,
  userId: string,
  postId: string
) => {
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
