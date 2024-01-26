import winston from 'winston'
import 'winston-daily-rotate-file'
import { is } from '@electron-toolkit/utils'
import utils from './utils'

const _formatMeta = (meta) => {
  return meta && Object.keys(meta).length ? JSON.stringify(meta) : ''
}

const _customLogFormat = winston.format.printf(
  ({ timestamp, level, message, ...meta }) =>
    `${timestamp}\t ${level.trim().toUpperCase()} ${message} ${_formatMeta(meta)}`
)

const _loggerOptions = {
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    _customLogFormat
  ),
  transports: []
}

if (is.dev) {
  _loggerOptions.transports.push(new winston.transports.Console({ level: 'debug' }))
} else {
  console.log(`log folder: ${utils.getAppPath('logs')}`)
  _loggerOptions.transports.push(
    new winston.transports.DailyRotateFile({
      dirname: utils.getAppPath('logs'),
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  )
}

const logger = winston.createLogger(_loggerOptions)

export default logger
