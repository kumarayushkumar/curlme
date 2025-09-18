import compression from 'compression'
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import http from 'http'
import morgan from 'morgan'
import errorHandler from './middlewares/handle-error.js'
import ROUTER from './routes/index.js'
import { HTTP_STATUS_CODE, VERSION } from './utils/constants.js'
import { logger, logResReq } from './utils/logger.js'

const app = express()

process.on('uncaughtException', error => {
  logger.error(
    `uncaught exception: error: ${error} stack: ${error.stack} timestamp: ${new Date().toISOString()}`
  )
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    `uncaught rejection at: ${promise} reason: ${reason} timestamp: ${new Date().toISOString()}`
  )
  process.exit(1)
})

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received. shutting down gracefully...')
  process.exit(0)
})

const morganMiddleware = morgan(
  ':remote-addr | :remote-user | :method | :url | HTTP/:http-version | :status | :res[content-length] | :referrer | :user-agent',
  { stream: { write: message => logResReq.info(message.trim()) } }
)

const serverConfig = () => {
  console.log('server configuration started')

  app.set('trust proxy', true)

  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false
    })
  )

  // Performance optimization
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        const contentType = res.getHeader('Content-Type')
        if (
          (typeof contentType === 'string' &&
            contentType.includes('application/json')) ||
          (Array.isArray(contentType) &&
            contentType.some(
              type =>
                typeof type === 'string' && type.includes('application/json')
            ))
        ) {
          return true
        }
        return compression.filter(req, res)
      }
    })
  )

  app.use(morganMiddleware)
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  app.get('/health', (_, res: express.Response) => {
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: VERSION
      },
      message: 'curlme server is running'
    })
  })

  ROUTER.forEach(route => {
    app.use(route.path, route.router)
  })

  app.use(errorHandler)

  const PORT = process.env.PORT || 8000

  http
    .createServer(app)
    .listen(PORT, () =>
      console.log(`express is listening at http://localhost:${PORT}`)
    )
}

serverConfig()
