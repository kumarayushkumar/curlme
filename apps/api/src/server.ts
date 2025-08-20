import 'dotenv/config'
import express from 'express'
import http from 'http'

import ROUTER from './routes.js'
import errorHandler from './middlewares/handle-error.js'
import { HTTP_STATUS_CODE } from './utils/constants.js'
import { VERSION } from './utils/constants.js'
import { toPlainText } from './utils/helper.js'

const app = express()

process.on('uncaughtException', _err => {
  console.error('Uncaught Exception:', _err)
  process.exit(1)
})

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err)
  process.exit(1)
})

const serverConfig = () => {
  console.log('Server configuration started')
  app.use((req, res, next) => {
    console.log(
      `Incoming -> Method: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - Method: [${req.method}]`
    )
    res.on('finish', () => {
      console.log(
        `Outgoing -> Status: [${res.statusCode}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - Method: [${req.method}]`
      )
    })
    next()
  })

  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  app.get('/health', (_, res: express.Response) => {
    return res.status(HTTP_STATUS_CODE.OK).send(
      toPlainText({
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: VERSION
      })
    )
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
