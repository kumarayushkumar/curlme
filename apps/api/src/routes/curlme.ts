import { Router } from 'express'
import { feedbackHandler, landingHandler } from '../handlers/curlme.handler.js'
import { catchError } from '../middlewares/catch-error.js'
import { limiter } from '../middlewares/rate-limiter.js'

const router = Router()

router.get('/', limiter, catchError(landingHandler))
router.get('/feedback', limiter, catchError(feedbackHandler))

export default router
