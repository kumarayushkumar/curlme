import { prisma } from '../../config/database.js'
import type { CachedPost } from '../../types/post.js'
import { logger } from '../../utils/logger.js'
import { getPostsFromCache, setPostsInCache } from '../../utils/redis.js'

const deletePostController = async (postId: string, userId: string) => {
  const post = await prisma.post.findFirst({ where: { id: postId, userId } })
  if (!post) return null

  await prisma.$transaction(async tx => {
    await tx.reply.deleteMany({ where: { postId } })
    await tx.like.deleteMany({ where: { postId } })
    await tx.post.delete({ where: { id: postId } })
  })

  // Invalidate cache after post deletion
  try {
    const cachedPosts = await getPostsFromCache()
    if (cachedPosts) {
      await setPostsInCache(
        cachedPosts.filter((post: CachedPost) => post.id !== postId)
      )
    }
  } catch (error) {
    logger.error(
      `${__filename} | failed to invalidate cache after post deletion: ${error}`
    )
  }

  return { id: postId }
}

export default deletePostController
