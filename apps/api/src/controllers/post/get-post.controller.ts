import { prisma } from '../../utils/database.js'

const getPostController = async (
  postId: string,
  page: number,
  limit: number
) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      replies: {
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit + 1
      },
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!post) return null

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    replies: post.replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString()
    })),
    username: post.user.username
  }
}

export default getPostController
