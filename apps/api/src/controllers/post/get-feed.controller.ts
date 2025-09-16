/**
 * Controller for retrieving paginated feed of posts
 */

import { prisma } from '../../config/database.js'
import { logger } from '../../utils/logger.js'
import { getPostsFromCache, warmFeedCache } from '../../utils/redis.js'

/**
 * Retrieves paginated feed of posts with caching
 *
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of posts per page
 * @returns {Promise<{posts: any[], pagination: {currentPage: number, hasNextPage: boolean, hasPreviousPage: boolean, totalPostsOnPage: number, limit: number}}>} - Feed data with posts and pagination info
 */
const getFeedController = async (
  page: number,
  limit: number
): Promise<{
  posts: any[]
  pagination: {
    currentPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    totalPostsOnPage: number
    limit: number
  }
}> => {
  let cachedPosts = await getPostsFromCache()

  if (cachedPosts.length === 0) {
    logger.info(`${__filename} | cache miss, warming up cache`)
    await warmFeedCache()
    cachedPosts = await getPostsFromCache()
  }

  // If cache is still empty or pagination exceeds cache, fetch from DB
  if (cachedPosts.length === 0 || (page - 1) * limit >= cachedPosts.length) {
    logger.info(
      `${__filename} | cache miss or pagination exceeds cache, fetching from db`
    )
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit + 1, // Take one extra to check if there are more pages
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check if there are more posts than the current page limit
    const hasNextPage = posts.length > limit
    const resultPosts = hasNextPage ? posts.slice(0, limit) : posts

    return {
      posts: resultPosts,
      pagination: {
        currentPage: page,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPreviousPage: page > 1,
        totalPostsOnPage: resultPosts.length
      }
    }
  }

  // Return paginated cache results
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedPosts = cachedPosts.slice(startIndex, endIndex + 1) // Take one extra

  // Check if there are more posts in cache
  const hasNextPage =
    paginatedPosts.length > limit || endIndex + 1 < cachedPosts.length
  const resultPosts =
    hasNextPage && paginatedPosts.length > limit
      ? paginatedPosts.slice(0, limit)
      : paginatedPosts.slice(0, limit)

  return {
    posts: resultPosts,
    pagination: {
      currentPage: page,
      limit: limit,
      hasNextPage: hasNextPage,
      hasPreviousPage: page > 1,
      totalPostsOnPage: resultPosts.length
    }
  }
}

export default getFeedController
