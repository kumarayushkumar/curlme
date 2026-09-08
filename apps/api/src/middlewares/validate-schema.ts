/**
 * Schema validation middleware using Zod
 */

import type { NextFunction, Request, Response } from 'express'
import type { ZodError, ZodSchema } from 'zod'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

type ValidRequestType = 'body' | 'query' | 'params'

type FieldIssue = {
  field: string
  message: string
}

/**
 * Flattens a ZodError into the field/message pairs the client can display
 *
 * @param {ZodError} error - The error produced by a failed parse
 * @returns {FieldIssue[]} - One entry per validation problem
 */
const formatIssues = (error: ZodError): FieldIssue[] => {
  return error.issues.map(issue => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'request',
    message: issue.message
  }))
}

/**
 * Middleware to validate request data against Zod schemas
 *
 * @param {ZodSchema} schemas - Zod schema to validate against
 * @param {ValidRequestType} type - Request property to validate (body, query, or params)
 */
export const validateSchema = (
  schemas: ZodSchema,
  type: ValidRequestType = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schemas.safeParse(req[type])

    if (result.success) return next()

    const issues = formatIssues(result.error)

    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
      success: false,
      error: 'validation_error',
      issues,
      message: issues
        .map(issue => `${issue.field}: ${issue.message}`)
        .join(', ')
    })
  }
}
