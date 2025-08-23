import { prisma } from '../../utils/database.js'

const getUserController = async (userId?: string | null, username?: string) => {
  let whereClause

  if (!username && !userId) return null
  whereClause = username
    ? ({ username } as { username: string })
    : ({ id: userId! } as { id: string })

  const user = await prisma.user.findUnique({
    where: whereClause,
    include: {
      Post: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: {
        select: {
          Post: true,
          Reply: true
        }
      }
    }
  })

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    joined: user.createdAt.toISOString(),
    posts_count: user._count.Post,
    replies_count: user._count.Reply,
    recent_posts: user.Post.map(
      (post: {
        id: any
        content: any
        likesCount: any
        createdAt: { toISOString: () => string }
      }) => ({
        id: post.id,
        content: post.content,
        likes: post.likesCount,
        created: post.createdAt.toISOString()
      })
    )
  }
}

export default getUserController
