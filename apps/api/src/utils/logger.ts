import fs from 'fs'
import path from 'path'
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { syslog } from 'winston/lib/winston/config/index.js'

const { combine, timestamp, printf, errors } = format

const logDir = process.env.LOG_DIR ?? 'logs'
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
const fileDatePattern = 'YYYY-MM-DD'

// Ensure the logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const logFormat = printf(
  ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`
)

// Log filter
const errorFilter = format((info, _) => (info.level === 'error' ? info : false))
const infoFilter = format((info, _) => (info.level === 'info' ? info : false))

// Log rotate
const logRotate = (
  filename: string,
  maxFiles: string,
  fmt?: any
): DailyRotateFile => {
  const subDir = path.join(logDir, filename)
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true })
  }

  const options: any = {
    filename: `${filename}-%DATE%.log`,
    datePattern: fileDatePattern,
    zippedArchive: false,
    maxSize: '20m',
    dirname: subDir,
    maxFiles: maxFiles
  }
  if (fmt) {
    options.format = fmt
  }
  return new DailyRotateFile(options)
}

// Logger
const logger = createLogger({
  levels: syslog.levels,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: dateTimeFormat }),
    logFormat
  ),
  transports: [
    // Rotate error and info logs daily, keep for 14 days
    logRotate('error', '14d', errorFilter()),
    logRotate('info', '14d', infoFilter()),
    new transports.Console({
      level: 'error',
      format: combine(
        format.colorize(),
        timestamp({ format: dateTimeFormat }),
        logFormat
      )
    })
  ]
})

const logResReq = createLogger({
  levels: syslog.levels,
  level: 'info',
  format: combine(timestamp({ format: dateTimeFormat }), logFormat),
  transports: [logRotate('res-req', '14d')]
})

export { logger, logResReq }
