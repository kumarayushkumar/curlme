import { prisma } from '../../utils/database.js'
import { cachePost } from '../../utils/redis.js'

const createPostController = async (content: string, userId: string) => {
  const post = await prisma.post.create({
    data: {
      content,
      userId: userId
    },
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!post) return null

  await cachePost(post)

  return {
    postId: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString()
  }
}

export default createPostController
