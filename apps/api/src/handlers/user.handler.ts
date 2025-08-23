import type { Request, Response } from 'express'
import getUserController from '../controllers/user/get-user.controller.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

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
          error: 'User not found',
          message: `User '${requestedUsername}' could not be found`
        })
      }
    } else {
      // Fetching own profile
      profile = await getUserController(currentUserId)

      if (!profile) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          error: 'User not found',
          message: 'Your profile could not be found'
        })
      }
    }

    return res.status(HTTP_STATUS_CODE.OK).json(profile)
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching profile'
    })
  }
}
