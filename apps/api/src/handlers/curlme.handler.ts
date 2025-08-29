import type { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

export const curlmeHandler = async (_req: Request, res: Response) => {
  const multiLineMessage = [
    'Welcome to CurlMe!',
    'I made this project for fun',
    'If you are enjoying using it, let me know!',
    'If you want to request a feature or report a bug, feel free to reach out!',
    'https://x.com/ayushkumarkeirn'
  ]

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    data: {
      message: multiLineMessage.join('\n')
    },
    message: 'Hello from CurlMe! :)'
  })
}
