import type { Request, Response } from 'express'
import createPostController from '../controllers/post/create-post.controller.js'
import deletePostController from '../controllers/post/delete-post.controller.js'
import getFeedController from '../controllers/post/get-feed.controller.js'
import getPostController from '../controllers/post/get-post.controller.js'
import toggleLikePostController from '../controllers/post/toggle-like-post.controller.js'
import { HTTP_STATUS_CODE, POST_LIMIT } from '../utils/constants.js'

export const getFeedHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || POST_LIMIT

    const feed = await getFeedController(page, limit)

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: feed,
      message: 'feed fetched successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while fetching feed'
    })
  }
}

export const getPostHandler = async (req: Request, res: Response) => {
  try {
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
      data: post,
      message: 'post fetched successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while fetching post'
    })
  }
}

export const createPostHandler = async (req: Request, res: Response) => {
  try {
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
      data: post,
      message: 'post created successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while creating post'
    })
  }
}

export const deletePostHandler = async (req: Request, res: Response) => {
  try {
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
      data: post,
      message: 'post deleted successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while deleting post'
    })
  }
}

export const toggleLikePostHandler = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while toggling post like'
    })
  }
}
