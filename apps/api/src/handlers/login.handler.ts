/**
 * Handler for GitHub OAuth device flow authentication
 */

import axios from 'axios'
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/database.js'
import type { GitHubDeviceTokenResponse, GitHubUser } from '../types/github.js'
import { GITHUB_CLIENT_ID, HTTP_STATUS_CODE } from '../utils/constants.js'
import { generateToken } from '../utils/jwt.js'

/**
 * Handler for GitHub OAuth device flow authentication
 */
export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { device_code } = req.body

    if (!device_code) {
      const deviceFlowResponse = await axios.post(
        'https://github.com/login/device/code',
        {
          client_id: GITHUB_CLIENT_ID,
          scope: 'read:user'
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )

      return res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'gitHub authentication required',
        data: {
          device_code: deviceFlowResponse.data.device_code,
          user_code: deviceFlowResponse.data.user_code,
          verification_uri: deviceFlowResponse.data.verification_uri,
          expires_in: deviceFlowResponse.data.expires_in,
          interval: deviceFlowResponse.data.interval,
          instructions: `1. Visit ${deviceFlowResponse.data.verification_uri} and enter code: ${deviceFlowResponse.data.user_code}
2. After authorization, run: curl -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"device_code":"${deviceFlowResponse.data.device_code}"}'`
        }
      })
    }

    // Exchange device code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    const tokenData = tokenResponse.data as GitHubDeviceTokenResponse

    if (!tokenData.access_token) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        error: 'authorization_pending_or_denied',
        message: 'please complete gitHub authorization or try again'
      })
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json'
      }
    })

    const githubUser = userResponse.data as GitHubUser

    let user = await prisma.user.findUnique({
      where: { username: githubUser.login }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: githubUser.login,
          name: githubUser.name || githubUser.login
        }
      })
    }

    const jwtToken = generateToken({
      userId: user.id,
      username: user.username
    })

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: 'login successful',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        instructions: 'use this token in authorization header: Bearer <token>'
      }
    })
  } catch (error: any) {
    if (
      error.response?.status === HTTP_STATUS_CODE.BAD_REQUEST &&
      error.response?.data?.error === 'authorization_pending'
    ) {
      return res.status(HTTP_STATUS_CODE.ACCEPTED).json({
        success: false,
        error: 'authorization_pending',
        message: 'please complete gitHub authorization in your browser'
      })
    }

    if (
      error.response?.status === HTTP_STATUS_CODE.BAD_REQUEST &&
      error.response?.data?.error === 'slow_down'
    ) {
      return res.status(HTTP_STATUS_CODE.TOO_MANY_REQUESTS).json({
        success: false,
        error: 'too_many_requests',
        message: 'Too many requests, please wait before trying again'
      })
    }
    next(error)
  }
}
