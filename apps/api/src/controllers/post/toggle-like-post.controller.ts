/**
 * Controller for toggling post likes
 */

import { prisma } from '../../config/database.js'
import { updatePostInCache } from '../../utils/redis.js'

/**
 * Toggles like/unlike status for a post
 *
 * @param {string} postId - The ID of the post to like/unlike
 * @param {string} userId - The ID of the user performing the action
 * @returns {Promise<{message: string}|null>} - Updated like status or null if post not found
 */
const toggleLikePostController = async (
  postId: string,
  userId: string
): Promise<{ message: string } | null> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { likes: true }
  })

  if (!post) return null

  // Check if user already liked this post
  const existingLike = await prisma.like.findUnique({
    where: {
      unique_user_post_like: {
        userId: userId,
        postId: postId
      }
    }
  })

  let action: 'liked' | 'unliked'
  let newLikesCount: number

  if (existingLike) {
    // Unlike: Remove like and decrement count
    await prisma.$transaction([
      prisma.like.delete({
        where: { id: existingLike.id }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } }
      })
    ])

    action = 'unliked'
    newLikesCount = post.likesCount - 1
  } else {
    // Like: Add like and increment count
    await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: userId,
          postId: postId
        }
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } }
      })
    ])

    action = 'liked'
    newLikesCount = post.likesCount + 1
  }

  // Update the cache with new likes count
  await updatePostInCache(postId, { likesCount: newLikesCount })

  return {
    message: `Post ${action} successfully`
  }
}

export default toggleLikePostController
