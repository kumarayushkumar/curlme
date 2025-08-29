import { redisConnection } from '../config/redis.js'
import type { CachedPost } from '../types/post.js'
import { CACHE_TTL, POST_LIMIT } from './constants.js'
import { prisma } from './database.js'
import { logger } from './logger.js'

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

export const getPostsFromCache = async (): Promise<CachedPost[]> => {
  try {
    const cachedPosts = await redisConnection.get('feed')
    return cachedPosts ? JSON.parse(cachedPosts) : []
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
    return []
  }
}

export const setPostsInCache = async (posts: CachedPost[]) => {
  try {
    await redisConnection.set('feed', JSON.stringify(posts), 'EX', CACHE_TTL)
  } catch (error) {
    logger.error(`${__filename} | ${error}`)
  }
}

// Function to warm up the cache with fresh data from DB
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

// Function to update a specific post's counts in cache
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
