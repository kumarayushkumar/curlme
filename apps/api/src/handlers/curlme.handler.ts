/**
 * Handler for curlme landing and feedback endpoints
 */

import type { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

/**
 * Handler for the curlme landing endpoint
 */
export const landingHandler = async (_req: Request, res: Response) => {
  const message = [
    'sudo npm i -g curlme',
    'visit https://github.com/kumarayushkumar/curlme',
    `cli-version: 1.0.3`
  ]
  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: { message },
    message: 'Hello from Curlme! :)'
  })
}

/**
 * Handler for the curlme feedback endpoint
 */
export const feedbackHandler = async (_req: Request, res: Response) => {
  const multiLineMessage = [
    'Welcome to Curlme!',
    'I made this project for fun',
    'If you are enjoying using it, let me know!',
    'If you want to request a feature or report a bug, feel free to reach out!',
    'https://x.com/ayushkumarkeirn',
    'If you want to contribute, visit https://github.com/kumarayushkumar/curlme'
  ]

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: {
      message: multiLineMessage
    },
    message: 'Hello from Curlme! :)'
  })
}
