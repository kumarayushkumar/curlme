import 'dotenv/config'
import express from 'express'
import http from 'http'

const app = express()

process.on('uncaughtException', _err => {
  process.exit(1)
})

process.on('unhandledRejection', err => {
  throw err
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

  app.get('/health', (_, res: express.Response) => {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }

    return res.status(200).json(healthCheck)
  })

  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  const PORT = process.env.PORT || 8000

  http
    .createServer(app)
    .listen(PORT, () =>
      console.log(`Express is listening at http://localhost:${PORT}`)
    )
}

serverConfig()
