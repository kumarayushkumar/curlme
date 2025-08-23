import { prisma } from '../../utils/database.js'
import { getPostsFromCache } from '../../utils/redis.js'

const getFeedController = async (page: number, limit: number) => {
  const cachedPosts = await getPostsFromCache()
  if (!cachedPosts) {
    return prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })
  }

  if (page * limit > cachedPosts.length) {
    return prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })
  }

  return cachedPosts.slice((page - 1) * limit, page * limit)
}

export default getFeedController
