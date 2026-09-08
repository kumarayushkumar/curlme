/**
 * Handlers for the admin monitoring endpoints
 */

import type { Role } from '@prisma/client'
import type { Request, Response } from 'express'
import getDashboardController from '../controllers/admin/get-dashboard.controller.js'
import getDesignationStatsController from '../controllers/admin/get-designation-stats.controller.js'
import getFollowGraphController from '../controllers/admin/get-follow-graph.controller.js'
import getOverviewController from '../controllers/admin/get-overview.controller.js'
import getTopEngagedController from '../controllers/admin/get-top-engaged.controller.js'
import getTopFollowedController from '../controllers/admin/get-top-followed.controller.js'
import getTopPostsController from '../controllers/admin/get-top-posts.controller.js'
import setUserActiveController, {
  type SetUserActiveError
} from '../controllers/admin/set-user-active.controller.js'
import setUserRoleController, {
  type SetUserRoleError
} from '../controllers/admin/set-user-role.controller.js'
import {
  HTTP_STATUS_CODE,
  STATS_LIMIT,
  STATS_MAX_LIMIT
} from '../utils/constants.js'
import { sendError, sendSuccess, type ErrorSpec } from '../utils/respond.js'

const SET_ROLE_ERRORS: Record<SetUserRoleError, ErrorSpec> = {
  user_not_found: {
    status: HTTP_STATUS_CODE.NOT_FOUND,
    error: 'not_found',
    message: 'that user does not exist'
  },
  self_demotion: {
    status: HTTP_STATUS_CODE.BAD_REQUEST,
    error: 'self_demotion',
    message: 'you cannot remove your own admin role, ask another admin to do it'
  }
}

const SET_ACTIVE_ERRORS: Record<SetUserActiveError, ErrorSpec> = {
  user_not_found: {
    status: HTTP_STATUS_CODE.NOT_FOUND,
    error: 'not_found',
    message: 'that user does not exist'
  },
  self_deactivation: {
    status: HTTP_STATUS_CODE.BAD_REQUEST,
    error: 'self_deactivation',
    message:
      'you cannot deactivate your own account, ask another admin to do it'
  }
}

/**
 * Reads the row limit from the query string, clamped to the allowed range
 *
 * @param {unknown} value - The raw `limit` query parameter
 * @returns {number} - A safe row limit
 */
const resolveLimit = (value: unknown): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10)

  if (Number.isNaN(parsed)) return STATS_LIMIT

  return Math.min(Math.max(parsed, 1), STATS_MAX_LIMIT)
}

/**
 * Builds a handler for a ranked statistics table
 *
 * @param {string} key - Key the rows are returned under
 * @param {(limit: number) => Promise<unknown>} load - Controller producing the rows
 * @param {string} message - Human readable summary for the response
 * @returns {(req: Request, res: Response) => Promise<unknown>} - Express handler
 */
const rankedStatsHandler = (
  key: string,
  load: (limit: number) => Promise<unknown>,
  message: string
) => {
  return async (req: Request, res: Response) => {
    const limit = resolveLimit(req.query.limit)
    const rows = await load(limit)

    return sendSuccess(res, { [key]: rows, limit }, message)
  }
}

/**
 * Handler for the whole dashboard in one response
 */
export const getDashboardHandler = async (req: Request, res: Response) => {
  const limit = resolveLimit(req.query.limit)
  const dashboard = await getDashboardController(limit)

  return sendSuccess(
    res,
    { ...dashboard, limit },
    'dashboard fetched successfully'
  )
}

/**
 * Handler for the platform overview counters
 */
export const getOverviewHandler = async (_req: Request, res: Response) => {
  const overview = await getOverviewController()

  return sendSuccess(res, { overview }, 'overview fetched successfully')
}

/**
 * Handler for the designation breakdown
 */
export const getDesignationStatsHandler = async (
  _req: Request,
  res: Response
) => {
  const designations = await getDesignationStatsController()

  return sendSuccess(
    res,
    { designations },
    'designation stats fetched successfully'
  )
}

export const getTopFollowedHandler = rankedStatsHandler(
  'top_followed',
  getTopFollowedController,
  'most followed users fetched successfully'
)

export const getTopPostsHandler = rankedStatsHandler(
  'top_posts',
  getTopPostsController,
  'most liked posts fetched successfully'
)

export const getTopEngagedHandler = rankedStatsHandler(
  'top_engaged',
  getTopEngagedController,
  'most active users fetched successfully'
)

export const getFollowGraphHandler = rankedStatsHandler(
  'follow_graph',
  getFollowGraphController,
  'follow graph fetched successfully'
)

/**
 * Handler for promoting or demoting an account
 */
export const setUserRoleHandler = async (req: Request, res: Response) => {
  const actingUserId = req.user!.userId
  const username = req.params.username as string
  const { role } = req.body as { role: Role }

  const result = await setUserRoleController(actingUserId, username, role)

  if (!result.ok) return sendError(res, SET_ROLE_ERRORS[result.error])

  return sendSuccess(
    res,
    result.value,
    `@${result.value.username} is now ${result.value.role}`
  )
}

/**
 * Handler for deactivating or restoring an account
 */
export const setUserActiveHandler = async (req: Request, res: Response) => {
  const actingUserId = req.user!.userId
  const username = req.params.username as string
  const { is_active: isActive } = req.body as { is_active: boolean }

  const result = await setUserActiveController(actingUserId, username, isActive)

  if (!result.ok) return sendError(res, SET_ACTIVE_ERRORS[result.error])

  const state = result.value.is_active ? 'active' : 'deactivated'

  return sendSuccess(
    res,
    result.value,
    `@${result.value.username} is now ${state}`
  )
}
