import dotenv from 'dotenv'

dotenv.config()

import winston, { createLogger, format, transports } from 'winston'
import LokiTransport from 'winston-loki'

const { combine, timestamp, prettyPrint, printf, errors } = format

const dateFormat = 'YYYY-MM-DD HH:mm:ss'

// ANSI color codes for custom coloring
const colors = {
  gray: '\x1b[90m',
  reset: '\x1b[0m'
}

// Enhanced detailed log format with structured metadata
const detailedLogFormat = printf(
  ({ level, message, timestamp, jobId, experimentName, service, ...meta }) => {
    const serviceTag = service ? `[${service.toUpperCase()}]` : ''
    const jobTag = jobId ? `[JOB:${jobId}]` : ''
    const experimentTag = experimentName ? `[EXP:${experimentName}]` : ''

    // Format metadata in a more readable way
    const metaString = Object.entries(meta)
      // eslint-disable-next-line no-unused-vars
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value, null, 2)}`
        }
        return `${key}: ${value}`
      })
      .join(' | ')

    const metaSection = metaString
      ? `\n   ${colors.gray}📊 Metadata: ${metaString}${colors.reset}`
      : ''

    // Color timestamp gray while keeping other elements with their winston colors
    return `${colors.gray}${timestamp}${colors.reset} ${level} ${serviceTag} ${jobTag} ${experimentTag} → ${message}${metaSection}`
  }
)

const customLoggerConfig = {
  levels: {
    critical: 0,
    error: 1,
    warn: 2,
    success: 3,
    info: 4,
    debug: 5
  },
  colors: {
    critical: 'magenta', // Bright magenta for critical issues
    error: 'red', // Keep red for errors
    warn: 'yellow', // Keep yellow for warnings
    success: 'green', // Keep green for success
    info: 'cyan', // Cyan for info (better than white)
    debug: 'gray' // Gray for debug (less intrusive than pink)
  }
}

winston.addColors(customLoggerConfig.colors)

const lokiTransport = serviceName =>
  new LokiTransport({
    host: process.env.LOKI_URL,
    labels: { service_name: serviceName },
    format: combine(timestamp({ format: dateFormat }), prettyPrint())
  })

const detailedConsoleTransport = new transports.Console({
  format: combine(
    format.colorize({
      all: true
    }),
    timestamp({ format: dateFormat }),
    detailedLogFormat,
    errors({
      stack: true
    })
  )
})

const loggerTransports = serviceName =>
  process.env.CONSOLE_ONLY_LOGGING === 'true'
    ? [detailedConsoleTransport]
    : [detailedConsoleTransport, lokiTransport(serviceName)]

// Logger
export const logger = createLogger({
  levels: customLoggerConfig.levels,
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'cli-server' },
  transports: loggerTransports('cli-server'),
  exceptionHandlers: loggerTransports('cli-server'),
  rejectionHandlers: loggerTransports('cli-server')
})
