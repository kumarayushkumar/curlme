import { prisma } from '../../utils/database.js'
import { updatePostInCache } from '../../utils/redis.js'

const deleteReplyController = async (replyId: string, userId: string) => {
  const reply = await prisma.reply.findFirst({ where: { id: replyId, userId } })
  if (!reply) return null

  const postId = reply.postId

  await prisma.$transaction([
    prisma.like.deleteMany({ where: { replyId } }),
    prisma.reply.delete({ where: { id: replyId } }),
    prisma.post.update({
      where: { id: postId },
      data: { repliesCount: { decrement: 1 } }
    })
  ])

  // Update reply count in cache (-1)
  await updatePostInCache(postId, { replyCountChange: -1 })

  return { id: replyId }
}

export default deleteReplyController
