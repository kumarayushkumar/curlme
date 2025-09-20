/**
 * Handlers for post-related API endpoints
 */

import type { Request, Response } from 'express'
import createPostController from '../controllers/post/create-post.controller.js'
import deletePostController from '../controllers/post/delete-post.controller.js'
import getFeedController from '../controllers/post/get-feed.controller.js'
import getPostController from '../controllers/post/get-post.controller.js'
import toggleLikePostController from '../controllers/post/toggle-like-post.controller.js'
import { FEED_LIMIT, HTTP_STATUS_CODE, POST_LIMIT } from '../utils/constants.js'

/**
 * Handler for retrieving paginated feed of posts
 */
export const getFeedHandler = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || FEED_LIMIT

  const feed = await getFeedController(page, limit)

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: { feed },
    message: 'feed fetched successfully'
  })
}

/**
 * Handler for retrieving a single post with replies
 */
export const getPostHandler = async (req: Request, res: Response) => {
  const postId = req.params.postId as string
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || POST_LIMIT

  const post = await getPostController(postId, page, limit)
  if (!post) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      success: false,
      error: 'not_found',
      message: 'the requested post does not exist'
    })
  }

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: { post },
    message: 'post fetched successfully'
  })
}

/**
 * Handler for creating a new post
 */
export const createPostHandler = async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const content = req.body.content

  const post = await createPostController(content, userId)
  if (!post) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while creating post'
    })
  }

  return res.status(HTTP_STATUS_CODE.CREATED).json({
    success: true,
    data: { post },
    message: 'post created successfully'
  })
}

/**
 * Handler for deleting a post
 */
export const deletePostHandler = async (req: Request, res: Response) => {
  const postId = req.params.postId as string
  const userId = req.user!.userId

  const post = await deletePostController(postId, userId)

  if (!post) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      success: false,
      error: 'not_found',
      message: 'the post you are trying to delete does not exist'
    })
  }

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: { post },
    message: 'post deleted successfully'
  })
}

/**
 * Handler for toggling like/unlike on a post
 */
export const toggleLikePostHandler = async (req: Request, res: Response) => {
  const postId = req.params.postId as string
  const userId = req.user!.userId

  const result = await toggleLikePostController(postId, userId)

  if (!result) {
    return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
      success: false,
      error: 'not_found',
      message: 'the post you are trying to like/unlike does not exist'
    })
  }

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: {},
    message: result.message
  })
}
