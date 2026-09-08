import { Router } from 'express'

import {
  getDashboardHandler,
  getDesignationStatsHandler,
  getFollowGraphHandler,
  getOverviewHandler,
  getTopEngagedHandler,
  getTopFollowedHandler,
  getTopPostsHandler,
  setUserActiveHandler,
  setUserRoleHandler
} from '../handlers/admin.handler.js'
import { createDesignationHandler } from '../handlers/designation.handler.js'
import { adminMiddleware } from '../middlewares/admin.js'
import { authMiddleware } from '../middlewares/auth.js'
import { catchError } from '../middlewares/catch-error.js'
import { limiter } from '../middlewares/rate-limiter.js'
import { validateSchema } from '../middlewares/validate-schema.js'
import {
  activeSchema,
  createDesignationSchema,
  roleSchema,
  statsQuerySchema,
  usernameParamSchema
} from '../schema/validators.js'

const router = Router()

// Every route below is admin only. `authMiddleware` refreshes the account from
// the database, so `adminMiddleware` is a synchronous check on the result.
router.use(limiter, authMiddleware, adminMiddleware)

// monitoring
router.get(
  '/dashboard',
  validateSchema(statsQuerySchema, 'query'),
  catchError(getDashboardHandler)
)

router.get('/overview', catchError(getOverviewHandler))

router.get(
  '/top-followed',
  validateSchema(statsQuerySchema, 'query'),
  catchError(getTopFollowedHandler)
)

router.get(
  '/top-posts',
  validateSchema(statsQuerySchema, 'query'),
  catchError(getTopPostsHandler)
)

router.get(
  '/top-engaged',
  validateSchema(statsQuerySchema, 'query'),
  catchError(getTopEngagedHandler)
)

router.get(
  '/follow-graph',
  validateSchema(statsQuerySchema, 'query'),
  catchError(getFollowGraphHandler)
)

router.get('/designations', catchError(getDesignationStatsHandler))

// administration
router.post(
  '/designations',
  validateSchema(createDesignationSchema),
  catchError(createDesignationHandler)
)

router.patch(
  '/users/:username/role',
  validateSchema(usernameParamSchema, 'params'),
  validateSchema(roleSchema),
  catchError(setUserRoleHandler)
)

// Soft delete. The account is kept, so this is a PATCH of its state rather
// than a DELETE of the row.
router.patch(
  '/users/:username/active',
  validateSchema(usernameParamSchema, 'params'),
  validateSchema(activeSchema),
  catchError(setUserActiveHandler)
)

export default router
