import { prisma } from '../../utils/database.js'

const toggleLikeReplyController = async (replyId: string, userId: string) => {
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
