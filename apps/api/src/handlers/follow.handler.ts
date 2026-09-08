/**
 * Handlers for the follow graph endpoints
 */

import type { Request, Response } from 'express'
import followUserController, {
  type FollowError
} from '../controllers/follow/follow-user.controller.js'
import listFollowsController, {
  type FollowDirection,
  type FollowListError
} from '../controllers/follow/list-follows.controller.js'
import unfollowUserController, {
  type UnfollowError
} from '../controllers/follow/unfollow-user.controller.js'
import { FOLLOW_LIST_LIMIT, HTTP_STATUS_CODE } from '../utils/constants.js'
import { sendError, sendSuccess, type ErrorSpec } from '../utils/respond.js'

const USER_NOT_FOUND: ErrorSpec = {
  status: HTTP_STATUS_CODE.NOT_FOUND,
  error: 'not_found',
  message: 'that user does not exist'
}

const FOLLOW_ERRORS: Record<FollowError, ErrorSpec> = {
  user_not_found: USER_NOT_FOUND,
  self_follow: {
    status: HTTP_STATUS_CODE.BAD_REQUEST,
    error: 'self_follow',
    message: 'you cannot follow yourself'
  },
  already_following: {
    status: HTTP_STATUS_CODE.CONFLICT,
    error: 'already_following',
    message: 'you already follow that user'
  }
}

const UNFOLLOW_ERRORS: Record<UnfollowError, ErrorSpec> = {
  user_not_found: USER_NOT_FOUND,
  not_following: {
    status: HTTP_STATUS_CODE.CONFLICT,
    error: 'not_following',
    message: 'you do not follow that user'
  }
}

const FOLLOW_LIST_ERRORS: Record<FollowListError, ErrorSpec> = {
  user_not_found: USER_NOT_FOUND
}

/**
 * Handler for following a user
 */
export const followUserHandler = async (req: Request, res: Response) => {
  const followerId = req.user!.userId
  const username = req.params.username as string

  const result = await followUserController(followerId, username)

  if (!result.ok) return sendError(res, FOLLOW_ERRORS[result.error])

  return sendSuccess(
    res,
    result.value,
    `you are now following @${result.value.username}`,
    HTTP_STATUS_CODE.CREATED
  )
}

/**
 * Handler for unfollowing a user
 */
export const unfollowUserHandler = async (req: Request, res: Response) => {
  const followerId = req.user!.userId
  const username = req.params.username as string

  const result = await unfollowUserController(followerId, username)

  if (!result.ok) return sendError(res, UNFOLLOW_ERRORS[result.error])

  return sendSuccess(
    res,
    result.value,
    `you no longer follow @${result.value.username}`
  )
}

/**
 * Builds a handler that lists one direction of the follow graph
 *
 * @param {FollowDirection} direction - Whether to list followers or followees
 * @returns {(req: Request, res: Response) => Promise<unknown>} - Express handler
 */
const listFollowsHandler = (direction: FollowDirection) => {
  return async (req: Request, res: Response) => {
    // Falls back to the viewer's own graph when no username is supplied.
    const username = (req.params.username as string) || req.user!.username
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || FOLLOW_LIST_LIMIT

    const result = await listFollowsController(username, direction, page, limit)

    if (!result.ok) return sendError(res, FOLLOW_LIST_ERRORS[result.error])

    return sendSuccess(res, result.value, `${direction} fetched successfully`)
  }
}

export const getFollowersHandler = listFollowsHandler('followers')
export const getFollowingHandler = listFollowsHandler('following')
