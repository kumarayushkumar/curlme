import { Router } from 'express'

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
import { getUserHandler } from '../handlers/user.handler.js'
import { authMiddleware } from '../middlewares/auth.js'
import { catchError } from '../middlewares/catch-error.js'
import { limiter } from '../middlewares/rate-limiter.js'
import { validateSchema } from '../middlewares/validate-schema.js'
import {
  contentSchema,
  deviceCodeSchema,
  paginationSchema,
  postIdSchema,
  replyIdSchema,
  usernameSchema
} from '../schema/validators.js'

const router = Router()

router.post(
  '/login',
  limiter,
  validateSchema(deviceCodeSchema),
  catchError(loginHandler)
)

// profile
router.get('/profile', limiter, authMiddleware, catchError(getUserHandler))
router.get(
  '/profile/:username',
  limiter,
  validateSchema(usernameSchema, 'params'),
  authMiddleware,
  catchError(getUserHandler)
)

// post
router.get(
  '/feed',
  limiter,
  validateSchema(paginationSchema),
  authMiddleware,
  catchError(getFeedHandler)
)
router.get(
  '/get-post/:postId',
  limiter,
  validateSchema(postIdSchema),
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
  validateSchema(postIdSchema),
  authMiddleware,
  catchError(deletePostHandler)
)
router.post(
  '/toggle-like-post/:postId',
  limiter,
  validateSchema(postIdSchema),
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
  validateSchema(replyIdSchema),
  authMiddleware,
  catchError(deleteReplyHandler)
)
router.post(
  '/toggle-like-reply/:replyId',
  limiter,
  validateSchema(replyIdSchema),
  authMiddleware,
  catchError(toggleLikeReplyHandler)
)

export default router
