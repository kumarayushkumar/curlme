import { Router } from 'express'

import { registerHandler, signinHandler } from '../handlers/auth.handler.js'
import { listDesignationsHandler } from '../handlers/designation.handler.js'
import {
  followUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  unfollowUserHandler
} from '../handlers/follow.handler.js'
import { loginHandler } from '../handlers/login.handler.js'
import {
  createPostHandler,
  deletePostHandler,
  getFeedHandler,
  getPostHandler,
  toggleLikePostHandler
} from '../handlers/post.handler.js'
import {
  createReplyHandler,
  deleteReplyHandler,
  toggleLikeReplyHandler
} from '../handlers/reply.handler.js'
import {
  getUserHandler,
  updateProfileHandler
} from '../handlers/user.handler.js'
import { authMiddleware } from '../middlewares/auth.js'
import { catchError } from '../middlewares/catch-error.js'
import { limiter } from '../middlewares/rate-limiter.js'
import { validateSchema } from '../middlewares/validate-schema.js'
import {
  contentSchema,
  designationQuerySchema,
  deviceCodeSchema,
  paginationSchema,
  postIdSchema,
  registerSchema,
  replyIdSchema,
  signinSchema,
  updateProfileSchema,
  usernameParamSchema,
  usernameSchema
} from '../schema/validators.js'

const router = Router()

router.post(
  '/login',
  limiter,
  validateSchema(deviceCodeSchema),
  catchError(loginHandler)
)

router.post(
  '/register',
  limiter,
  validateSchema(registerSchema),
  catchError(registerHandler)
)

router.post(
  '/signin',
  limiter,
  validateSchema(signinSchema),
  catchError(signinHandler)
)

// designation
// Unauthenticated on purpose: the list has to be readable before registering.
router.get(
  '/designations',
  limiter,
  validateSchema(designationQuerySchema, 'query'),
  catchError(listDesignationsHandler)
)

// profile
router.get('/profile', limiter, authMiddleware, catchError(getUserHandler))
router.patch(
  '/profile',
  limiter,
  validateSchema(updateProfileSchema),
  authMiddleware,
  catchError(updateProfileHandler)
)
router.get(
  '/profile/:username',
  limiter,
  validateSchema(usernameSchema, 'params'),
  authMiddleware,
  catchError(getUserHandler)
)

// follow
router.post(
  '/follow/:username',
  limiter,
  validateSchema(usernameParamSchema, 'params'),
  authMiddleware,
  catchError(followUserHandler)
)
router.delete(
  '/unfollow/:username',
  limiter,
  validateSchema(usernameParamSchema, 'params'),
  authMiddleware,
  catchError(unfollowUserHandler)
)
router.get(
  '/followers',
  limiter,
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getFollowersHandler)
)
router.get(
  '/followers/:username',
  limiter,
  validateSchema(usernameParamSchema, 'params'),
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getFollowersHandler)
)
router.get(
  '/following',
  limiter,
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getFollowingHandler)
)
router.get(
  '/following/:username',
  limiter,
  validateSchema(usernameParamSchema, 'params'),
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getFollowingHandler)
)

// post
router.get(
  '/feed',
  limiter,
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getFeedHandler)
)
router.get(
  '/get-post/:postId',
  limiter,
  validateSchema(postIdSchema, 'params'),
  validateSchema(paginationSchema, 'query'),
  authMiddleware,
  catchError(getPostHandler)
)
router.post(
  '/create-post',
  limiter,
  validateSchema(contentSchema),
  authMiddleware,
  catchError(createPostHandler)
)
router.delete(
  '/delete-post/:postId',
  limiter,
  validateSchema(postIdSchema, 'params'),
  authMiddleware,
  catchError(deletePostHandler)
)
router.post(
  '/toggle-like-post/:postId',
  limiter,
  validateSchema(postIdSchema, 'params'),
  authMiddleware,
  catchError(toggleLikePostHandler)
)

// reply
router.post(
  '/create-reply/:postId',
  limiter,
  validateSchema(postIdSchema, 'params'),
  validateSchema(contentSchema),
  authMiddleware,
  catchError(createReplyHandler)
)
router.delete(
  '/delete-reply/:replyId',
  limiter,
  validateSchema(replyIdSchema, 'params'),
  authMiddleware,
  catchError(deleteReplyHandler)
)
router.post(
  '/toggle-like-reply/:replyId',
  limiter,
  validateSchema(replyIdSchema, 'params'),
  authMiddleware,
  catchError(toggleLikeReplyHandler)
)

export default router
