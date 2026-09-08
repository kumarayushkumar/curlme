/**
 * Handlers for username and password authentication
 */

import type { Request, Response } from 'express'
import registerController, {
  type RegisterError,
  type RegisterInput
} from '../controllers/auth/register.controller.js'
import signinController, {
  type SigninError
} from '../controllers/auth/signin.controller.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { generateToken } from '../utils/jwt.js'
import { sendError, sendSuccess, type ErrorSpec } from '../utils/respond.js'
import type { AccountView } from '../utils/user-view.js'

const REGISTER_ERRORS: Record<RegisterError, ErrorSpec> = {
  username_taken: {
    status: HTTP_STATUS_CODE.CONFLICT,
    error: 'username_taken',
    message: 'that username is already registered'
  },
  unknown_designation: {
    status: HTTP_STATUS_CODE.BAD_REQUEST,
    error: 'unknown_designation',
    message:
      'that designation does not exist, run `curlme designations` to see the current list'
  }
}

const SIGNIN_ERRORS: Record<SigninError, ErrorSpec> = {
  invalid_credentials: {
    status: HTTP_STATUS_CODE.UNAUTHORIZED,
    error: 'invalid_credentials',
    message: 'incorrect username or password'
  }
}

/**
 * Builds the token plus account payload returned by both auth endpoints
 *
 * @param {AccountView} account - The authenticated account
 * @returns {{token: string, user: AccountView}} - Session payload for the client
 */
const toSession = (account: AccountView) => ({
  token: generateToken({
    userId: account.id,
    username: account.username,
    role: account.role
  }),
  user: account
})

/**
 * Builds the register controller input from a validated request body
 *
 * `bio` is spread in only when it was supplied, because
 * `exactOptionalPropertyTypes` treats an explicit `undefined` as a different
 * thing from an absent key.
 *
 * @param {RegisterInput} body - The validated registration payload
 * @returns {RegisterInput} - Input for the register controller
 */
const toRegisterInput = (body: RegisterInput): RegisterInput => ({
  username: body.username,
  password: body.password,
  name: body.name,
  designation: body.designation,
  ...(body.bio === undefined ? {} : { bio: body.bio })
})

/**
 * Handler for creating an account with a username and password
 */
export const registerHandler = async (req: Request, res: Response) => {
  const result = await registerController(
    toRegisterInput(req.body as RegisterInput)
  )

  if (!result.ok) return sendError(res, REGISTER_ERRORS[result.error])

  return sendSuccess(
    res,
    toSession(result.value),
    'registration successful',
    HTTP_STATUS_CODE.CREATED
  )
}

/**
 * Handler for exchanging a username and password for a token
 */
export const signinHandler = async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username: string
    password: string
  }

  const result = await signinController(username, password)

  if (!result.ok) return sendError(res, SIGNIN_ERRORS[result.error])

  return sendSuccess(res, toSession(result.value), 'signin successful')
}
