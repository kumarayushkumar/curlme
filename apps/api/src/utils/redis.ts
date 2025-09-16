/**
 * Utility functions for caching and retrieving posts using Redis
 */
import { prisma } from '../config/database.js'
import { redisConnection } from '../config/redis.js'
import type { CachedPost } from '../types/post.js'
import { CACHE_TTL, POST_LIMIT } from './constants.js'
import { logger } from './logger.js'

/**
 * Caches a post object in Redis
 *
 * @param {CachedPost} post - Post object to cache
 */
export const cachePost = async (post: CachedPost) => {
  try {
    const cachedPosts = await redisConnection.get('feed')
    const posts = cachedPosts ? JSON.parse(cachedPosts) : []

    posts.unshift(post)
    if (posts.length > POST_LIMIT) {
      posts.pop()
    }

    await redisConnection.set('feed', JSON.stringify(posts), 'EX', CACHE_TTL)
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
  }
}

/**
 * Retrieves posts from Redis cache
 *
 * @returns {Promise<CachedPost[]>} - Array of cached posts or empty array if none
 */
export const getPostsFromCache = async (): Promise<CachedPost[]> => {
  try {
    const cachedPosts = await redisConnection.get('feed')
    return cachedPosts ? JSON.parse(cachedPosts) : []
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
    return []
  }
}

/**
 * Sets the entire posts array in Redis cache
 *
 * @param {CachedPost[]} posts - Array of post objects to cache
 */
export const setPostsInCache = async (posts: CachedPost[]) => {
  try {
    await redisConnection.set('feed', JSON.stringify(posts), 'EX', CACHE_TTL)
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
  }
}

/**
 * Warms up the cache with fresh data from the database
 */
export const warmFeedCache = async () => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      take: POST_LIMIT,
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (posts.length > 0) {
      await redisConnection.set('feed', JSON.stringify(posts), 'EX', CACHE_TTL)
    }
  } catch (error) {
    logger.error(`${__filename} | failed to warm cache: ${error}`)
  }
}

/**
 * Updates specific fields of a post in Redis cache
 *
 * @param {string} postId - ID of the post to update
 * @param {{likesCount?: number, replyCountChange?: number}} updates - Fields to update
 */
export const updatePostInCache = async (
  postId: string,
  updates: { likesCount?: number; replyCountChange?: number }
) => {
  try {
    const cachedPosts = await getPostsFromCache()
    if (cachedPosts.length === 0) return

    const postIndex = cachedPosts.findIndex(post => post.id === postId)
    if (postIndex === -1) return // Post not in cache

    const post = cachedPosts[postIndex]
    if (!post) return

    // Update only the fields that can change
    if (typeof updates.likesCount === 'number') {
      post.likesCount = updates.likesCount
    }

    // Update reply count by incrementing/decrementing
    if (typeof updates.replyCountChange === 'number') {
      const currentReplyCount = post.repliesCount || 0
      post.repliesCount = currentReplyCount + updates.replyCountChange
    }

    await setPostsInCache(cachedPosts)
    logger.info(`${__filename} | updated post ${postId} in cache`)
  } catch (error) {
    logger.error(`${__filename} | failed to update post in cache: ${error}`)
  }
}
