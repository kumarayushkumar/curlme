import type { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import createReplyController from '../controllers/reply/create-reply.controller.js'
import deleteReplyController from '../controllers/reply/delete-reply.controller.js'
import toggleLikeReplyController from '../controllers/reply/toggle-like-reply.controller.js'

export const createReplyHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId
    const content = req.body.content
    const postId = req.params.postId as string

    const reply = await createReplyController(content, userId, postId)
    if (!reply) {
      return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Reply creation failed',
        message: 'An error occurred while creating reply'
      })
    }

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      data: reply,
      message: 'Reply created successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Reply creation failed',
      message: 'An error occurred while creating post'
    })
  }
}

export const deleteReplyHandler = async (req: Request, res: Response) => {
  try {
    const replyId = req.params.replyId as string
    const userId = req.user!.userId

    const reply = await deleteReplyController(replyId, userId)

    if (!reply) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        error: 'Reply not found',
        message: 'The reply you are trying to delete does not exist'
      })
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: reply,
      message: 'Reply deleted successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Post deletion failed',
      message: 'An error occurred while deleting post'
    })
  }
}

export const toggleLikeReplyHandler = async (req: Request, res: Response) => {
  try {
    const replyId = req.params.replyId as string
    const userId = req.user!.userId

    const result = await toggleLikeReplyController(replyId, userId)

    if (!result) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        error: 'Reply not found',
        message: 'The reply you are trying to like/unlike does not exist'
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
      error: 'Internal Server Error',
      message: 'An error occurred while toggling reply like'
    })
  }
}
