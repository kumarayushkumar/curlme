import compression from 'compression'
import 'dotenv/config'
import express from 'express'
import http from 'http'
import helmet from 'helmet'
import morgan from 'morgan'
import errorHandler from './middlewares/handle-error.js'
import ROUTER from './routes.js'
import { HTTP_STATUS_CODE, VERSION } from './utils/constants.js'
import { logResReq } from './utils/logger.js'

const app = express()

process.on('uncaughtException', _err => {
  console.error('Uncaught Exception:', _err)
  process.exit(1)
})

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err)
  process.exit(1)
})

const morganMiddleware = morgan(
  ':remote-addr | :remote-user | :method | :url | HTTP/:http-version | :status | :res[content-length] | :referrer | :user-agent',
  { stream: { write: message => logResReq.info(message.trim()) } }
)

const serverConfig = () => {
  console.log('Server configuration started')

  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
  }))

  // Performance optimization
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      const contentType = res.getHeader('Content-Type');
      if (
        (typeof contentType === 'string' && contentType.includes('application/json')) ||
        (Array.isArray(contentType) && contentType.some(type => typeof type === 'string' && type.includes('application/json')))
      ) {
        return true;
      }
      return compression.filter(req, res);
    }
  }))

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
      }
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
      console.log(`Express is listening at http://localhost:${PORT}`)
    )
}

serverConfig()
