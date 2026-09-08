/**
 * Handlers for the designation catalogue
 */

import type { DesignationCategory } from '@prisma/client'
import type { Request, Response } from 'express'
import createDesignationController, {
  type CreateDesignationError,
  type CreateDesignationInput
} from '../controllers/designation/create-designation.controller.js'
import listDesignationsController, {
  type DesignationFilters
} from '../controllers/designation/list-designations.controller.js'
import { HTTP_STATUS_CODE } from '../utils/constants.js'
import { sendError, sendSuccess, type ErrorSpec } from '../utils/respond.js'

const CREATE_DESIGNATION_ERRORS: Record<CreateDesignationError, ErrorSpec> = {
  slug_taken: {
    status: HTTP_STATUS_CODE.CONFLICT,
    error: 'slug_taken',
    message: 'a designation with that slug already exists'
  }
}

/**
 * Reads the catalogue filters off a request that `designationQuerySchema` has
 * already validated
 *
 * Absent filters are left off the object rather than set to undefined, which
 * is what `exactOptionalPropertyTypes` asks for.
 *
 * @param {Request} req - Express request object
 * @returns {DesignationFilters} - The category and group filters that were supplied
 */
const readDesignationFilters = (req: Request): DesignationFilters => {
  const category = req.query.category as DesignationCategory | undefined
  const group = req.query.group as string | undefined

  return {
    ...(category ? { category } : {}),
    ...(group ? { group } : {})
  }
}

/**
 * Handler for listing the designations available at registration
 *
 * Deliberately unauthenticated: a client has to read this list before it can
 * create the account that would give it a token.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const listDesignationsHandler = async (req: Request, res: Response) => {
  const designations = await listDesignationsController(
    readDesignationFilters(req)
  )

  return sendSuccess(res, { designations }, 'designations fetched successfully')
}

/**
 * Handler for adding a designation
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createDesignationHandler = async (req: Request, res: Response) => {
  const result = await createDesignationController(
    req.body as CreateDesignationInput
  )

  if (!result.ok) {
    return sendError(res, CREATE_DESIGNATION_ERRORS[result.error])
  }

  return sendSuccess(
    res,
    { designation: result.value },
    'designation created successfully',
    HTTP_STATUS_CODE.CREATED
  )
}
