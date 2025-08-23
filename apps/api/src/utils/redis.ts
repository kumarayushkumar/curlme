import type { Post } from '@prisma/client'
import { redisConnection } from '../config/redis.js'
import { POST_LIMIT } from './constants.js'
import { logger } from './logger.js'

export const cachePost = async (post: Post) => {
  try {
    const cachedPosts = await redisConnection.get('feed')
    const posts = cachedPosts ? JSON.parse(cachedPosts) : []

    posts.unshift(post)
    if (posts.length > POST_LIMIT) {
      posts.pop()
    }

    await redisConnection.set('feed', JSON.stringify(posts))
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
  }
}

export const getPostsFromCache = async () => {
  const cachedPosts = await redisConnection.get('feed')
  return cachedPosts ? JSON.parse(cachedPosts) : []
}
