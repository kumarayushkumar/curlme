import { Router } from 'express'
import { feedbackHandler, landingHandler } from '../handlers/curlme.handler.js'
import { catchError } from '../middlewares/catch-error.js'

const router = Router()

router.get('/', catchError(landingHandler))
router.get('/feedback', catchError(feedbackHandler))

export default router
