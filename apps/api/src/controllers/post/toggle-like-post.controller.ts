/**
 * Controller for toggling post likes
 */

import { prisma } from '../../config/database.js'
import { updatePostInCache } from '../../utils/redis.js'

/**
 * Toggles like/unlike status for a post. The Like row, the post's own
 * `likesCount` and the post author's `totalLikesReceived` all move together in
 * one transaction. A user liking their own post is allowed and still counts.
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
    select: { userId: true, likesCount: true }
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

  const delta = existingLike ? -1 : 1
  const action = existingLike ? 'unliked' : 'liked'

  const likeWrite = existingLike
    ? prisma.like.delete({ where: { id: existingLike.id } })
    : prisma.like.create({ data: { userId: userId, postId: postId } })

  await prisma.$transaction([
    likeWrite,
    prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: delta } }
    }),
    prisma.user.update({
      where: { id: post.userId },
      data: { totalLikesReceived: { increment: delta } }
    })
  ])

  // Update the cache with new likes count
  await updatePostInCache(postId, { likesCount: post.likesCount + delta })

  return {
    message: `Post ${action} successfully`
  }
}

export default toggleLikePostController
