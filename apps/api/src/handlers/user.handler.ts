/**
 * Handlers for user-related API endpoints
 */

import type { Request, Response } from 'express'
import getUserController from '../controllers/user/get-user.controller.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { logger } from '../utils/logger.js'

/**
 * Handler for retrieving user profile by userId or username
 */
export const getUserHandler = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId
    const requestedUsername = req.params.username as string

    let profile

    if (requestedUsername) {
      // Fetching another user's profile by username
      profile = await getUserController(null, requestedUsername)

      if (!profile) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          success: false,
          error: 'not_found',
          message: `user '${requestedUsername}' could not be found`
        })
      }
    } else {
      profile = await getUserController(currentUserId)

      if (!profile) {
        logger.error(
          `${__filename} | cannot find own profile for userId: ${currentUserId}`
        )
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          success: false,
          error: 'not_found',
          message: 'your profile could not be found'
        })
      }
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: { profile },
      message: 'profile fetched successfully'
    })
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'internal_server_error',
      message: 'an error occurred while fetching profile'
    })
  }
}
