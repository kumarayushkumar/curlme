/**
 * Handlers for user-related API endpoints
 */

import type { Request, Response } from 'express'
import getUserController from '../controllers/user/get-user.controller.js'
import updateProfileController from '../controllers/user/update-profile.controller.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'
import { sendError, sendSuccess } from '../utils/respond.js'

/**
 * Handler for retrieving user profile by userId or username
 */
export const getUserHandler = async (req: Request, res: Response) => {
  const currentUserId = req.user!.userId
  const requestedUsername = req.params.username as string | undefined

  const profile = await getUserController(currentUserId, requestedUsername)

  if (!profile) {
    if (!requestedUsername) {
      logger.error(`cannot find own profile for userId: ${currentUserId}`)
    }

    return sendError(res, {
      status: HTTP_STATUS_CODE.NOT_FOUND,
      error: 'not_found',
      message: requestedUsername
        ? `user '${requestedUsername}' could not be found`
        : 'your profile could not be found'
    })
  }

  return sendSuccess(res, { profile }, 'profile fetched successfully')
}

/**
 * Handler for editing your own profile
 */
export const updateProfileHandler = async (req: Request, res: Response) => {
  const userId = req.user!.userId
  const { bio } = req.body as { bio: string }

  const profile = await updateProfileController(userId, bio)

  return sendSuccess(res, { profile }, 'profile updated successfully')
}
