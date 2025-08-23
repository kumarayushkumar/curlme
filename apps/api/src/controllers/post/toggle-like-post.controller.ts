import { prisma } from '../../utils/database.js'

const toggleLikePostController = async (postId: string, userId: string) => {
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
  }

  return {
    message: `Post ${action} successfully`
  }
}

export default toggleLikePostController
