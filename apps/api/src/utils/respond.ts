/**
 * Helpers for the response envelope shared by every endpoint
 */

import type { Response } from 'express'
import { HTTP_STATUS_CODE } from './constants.js'

export type ErrorSpec = {
  status: number
  error: string
  message: string
}

/**
 * Sends a failure envelope described by a lookup table entry
 *
 * @param {Response} res - Express response object
 * @param {ErrorSpec} spec - Status, machine readable code and human message
 */
export const sendError = (res: Response, spec: ErrorSpec) => {
  return res.status(spec.status).json({
    success: false,
    error: spec.error,
    message: spec.message
  })
}

/**
 * Sends a success envelope
 *
 * @param {Response} res - Express response object
 * @param {unknown} data - Payload placed under `data`
 * @param {string} message - Human readable summary
 * @param {number} status - HTTP status code, defaults to 200
 */
export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string,
  status: number = HTTP_STATUS_CODE.OK
) => {
  return res.status(status).json({ success: true, data, message })
}
