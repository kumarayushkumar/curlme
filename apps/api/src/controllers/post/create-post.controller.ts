import { prisma } from '../../config/database.js'
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

  // Cache the new post (it will have 0 replies since it's new)
  await cachePost(post)

  return {
    postId: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString()
  }
}

export default createPostController
