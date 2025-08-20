import { Router } from 'express'

import { getProfile } from '../controllers/user.js'
import { authMiddleware } from '../middlewares/auth.js'
import { catchError } from '../middlewares/catch-error.js'
import { login } from '../controllers/login.js'
import { deviceCodeSchema } from '../schema/validators.js'
import { validateSchema } from '../middlewares/validate-schema.js'
import { limiter } from '../middlewares/rate-limiter.js'

const router = Router()

router.post(
  '/login',
  limiter,
  validateSchema(deviceCodeSchema),
  catchError(login)
)

router.get('/profile', limiter, authMiddleware, catchError(getProfile))

export default router
