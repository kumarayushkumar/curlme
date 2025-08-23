import { prisma } from '../../utils/database.js'

const deletePostController = async (postId: string, userId: string) => {
  await prisma.$transaction([
    prisma.post.delete({
      where: { id: postId, userId: userId }
    }),
    prisma.reply.deleteMany({
      where: { postId: postId }
    })
  ])

  return true
}

export default deletePostController
