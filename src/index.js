import path from 'path'
import { homedir } from 'os'
import { Logger, transports } from 'winston'
import appRootDir from 'app-root-dir'

const isProduction = process.env.NODE_ENV === 'production'

const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024
const MAX_LOG_FILES = 10

const LOG_FILE_NAME = '.application.log'

const LOG_FILE_PATH = isProduction
  ? path.join(homedir(), LOG_FILE_NAME)
  : path.join(appRootDir.get(), LOG_FILE_NAME)

const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'verbose' : 'debug')

const logger = new Logger({
  transports: [
    new transports.Console({
      level: LOG_LEVEL,
      colorize: true,
      timestamp: true,
      prettyPrint: true
    }),
    new transports.File({
      level: LOG_LEVEL,
      filename: LOG_FILE_PATH,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      prettyPrint: true,
      maxSize: MAX_LOG_FILE_SIZE,
      maxFiles: MAX_LOG_FILES,
      json: false
    })
  ]
})

logger.expressMiddleware = (req, res, next) => {
  if (req.url.includes('__webpack') && !isProduction) {
    return next()
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  const defaultMessage = `${ip} - ${req.method} ${req.url}`

  const startTimeStamp = Date.now()
  const waitTimePrintInterval = 5000

  let waitingTime = 0

  const intervalId = setInterval(() => {
    waitingTime += waitTimePrintInterval

    logger.verbose(`${defaultMessage} - wait for ${waitingTime / 1000}s..`)
  }, waitTimePrintInterval)

  const printExecutionTime = (statusCode = '') => {
    const message = `${defaultMessage} - ${statusCode} - ${(Date.now() - startTimeStamp) / 1000}s`

    if (res.statusCode < 400) {
      logger.info(message)
    } else {
      logger.warn(message)
    }

    clearInterval(intervalId)
  }

  req.on('end', () => printExecutionTime(res.statusCode))
  req.on('close', () => printExecutionTime('[closed by user]'))

  return next()
}

logger.info(`Log File: ${LOG_FILE_PATH}.`)

export default logger
