import { Router } from 'express'
import { curlmeHandler } from '../handlers/curlme.handler.js'
import { catchError } from '../middlewares/catch-error.js'

const router = Router()

router.get('/', catchError(curlmeHandler))

export default router
