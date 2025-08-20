import type { Request, Response } from 'express'
import '../types/express.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { prisma } from '../utils/database.js'
import { toPlainText } from '../utils/helper.js'

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId 
  
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Post: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            Post: true,
            Reply: true
          }
        }
      }
    })

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).send(toPlainText({
        error: 'User not found',
        message: 'The user profile could not be found'
      }))
    }

    return res.status(HTTP_STATUS_CODE.OK).send(toPlainText({
      username: user.username,
      name: user.name,
      joined: user.createdAt.toISOString().split('T')[0],
      posts_count: user._count.Post,
      replies_count: user._count.Reply,
      recent_posts: user.Post.map(post => ({
        id: post.id,
        content: post.content,
        likes: post.likesCount,
        created: post.createdAt.toISOString().split('T')[0]
      }))
    }))

  } catch (error) {
    console.error('Profile error:', error)
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send(toPlainText({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile'
    }))
  }
}