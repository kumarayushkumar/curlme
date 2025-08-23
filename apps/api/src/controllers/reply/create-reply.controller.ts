import { prisma } from '../../utils/database.js'

const createReplyController = async (
  content: string,
  userId: string,
  postId: string
) => {
  const reply = await prisma.reply.create({
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
  })

  if (!reply) return null

  return {
    replyId: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString()
  }
}

export default createReplyController
