import { prisma } from '../../config/database.js'

const getPostController = async (
  postId: string,
  page: number,
  limit: number
) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      replies: {
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit + 1, // Take one extra to check if there are more pages
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      },
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!post) return null

  // Check if there are more replies than the current page limit
  const hasNextPage = post.replies.length > limit
  const replies = hasNextPage ? post.replies.slice(0, limit) : post.replies

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    likesCount: post.likesCount,
    repliesCount: post.repliesCount,
    replies: replies.map((reply: any) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      likesCount: reply.likesCount,
      username: reply.user.username
    })),
    username: post.user.username,
    pagination: {
      currentPage: page,
      limit: limit,
      hasNextPage: hasNextPage,
      totalRepliesOnPage: replies.length
    }
  }
}

export default getPostController
