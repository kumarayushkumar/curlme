import axios from 'axios'
import type { Request, Response } from 'express'

import type { GitHubDeviceTokenResponse, GitHubUser } from '../types/github.js'
import {
  GITHUB_CLIENT_ID,
  HTTP_STATUS_CODE
} from '../utils/constants.js'
import { prisma } from '../utils/database.js'
import { toPlainText } from '../utils/helper.js'
import { generateToken } from '../utils/jwt.js'

export const login = async (req: Request, res: Response) => {
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


      return res.status(HTTP_STATUS_CODE.OK).send(
        toPlainText({
          message: 'GitHub authentication required',
          device_code: deviceFlowResponse.data.device_code,
          user_code: deviceFlowResponse.data.user_code,
          verification_uri: deviceFlowResponse.data.verification_uri,
          expires_in: deviceFlowResponse.data.expires_in,
          interval: deviceFlowResponse.data.interval,
          instructions: `1. Visit ${deviceFlowResponse.data.verification_uri} and enter code: ${deviceFlowResponse.data.user_code}
2. After authorization, run: curl -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"device_code":"${deviceFlowResponse.data.device_code}"}'`
        })
      )
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
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send(
        toPlainText({
          error: 'Authorization pending or denied',
          message: 'Please complete GitHub authorization or try again'
        })
      )
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

    return res.status(HTTP_STATUS_CODE.OK).send(
      toPlainText({
        message: 'Login successful',
        token: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        instructions: 'Use this token in Authorization header: Bearer <token>'
      })
    )
  } catch (error: any) {
    if (
      error.response?.status === HTTP_STATUS_CODE.BAD_REQUEST &&
      error.response?.data?.error === 'authorization_pending'
    ) {
      return res.status(HTTP_STATUS_CODE.ACCEPTED).send(
        toPlainText({
          error: 'authorization_pending',
          message: 'Please complete GitHub authorization in your browser'
        })
      )
    }

    if (
      error.response?.status === HTTP_STATUS_CODE.BAD_REQUEST &&
      error.response?.data?.error === 'slow_down'
    ) {
      return res.status(HTTP_STATUS_CODE.TOO_MANY_REQUESTS).send(
        toPlainText({
          error: 'slow_down',
          message: 'Too many requests, please wait before trying again'
        })
      )
    }

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send(
      toPlainText({
        error: 'Login failed',
        message: 'An error occurred during authentication'
      })
    )
  } finally {
    await prisma.$disconnect()
  }
}
