/**
 * Schema validation middleware using Zod
 */

import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

type ValidRequestType = 'body' | 'query' | 'params'

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
    try {
      schemas.parse(req[type])
      next()
    } catch (error: any) {
      res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        error: error.errors,
        message: 'invalid request data'
      })
    }
  }
}
