import { prisma } from '../../utils/database.js'

const deleteReplyController = async (replyId: string, userId: string) => {
  return await prisma.reply.delete({
    where: { id: replyId, userId: userId }
  })
}

export default deleteReplyController
