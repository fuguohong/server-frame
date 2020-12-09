/**
 * Created Date: 2020/8/28
 * Author: fgh
 * Description:
 */
'use strict'

const winston = require('winston')
const util = require('util')
const config = require('./loader').loadConfig()
const path = require('path')

const { format } = winston
const logConfig = config.log

const transports = []
if (logConfig.console) {
  transports.push(new winston.transports.Console({
    level: logConfig.consoleLevel
  }))
}
if (logConfig.writeFile) {
  const logFile = path.join(logConfig.logDir, config.name + '.log')
  const errFile = path.join(logConfig.logDir, config.name + '.err.log')
  transports.push(new winston.transports.File({
    filename: errFile,
    level: 'error'
  }))
  transports.push(new winston.transports.File({
    filename: logFile
  }))
}

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    // format.errors({ stack: true }),
    format.splat(),
    // format.colorize({ level: true }),
    format.printf(info => {
      if (typeof info.message !== 'string') {
        info.message = util.format('%o', info.message)
      }
      if (info.stack && info.code) {
        info.stack = `code: ${info.code},${info.stack}`
      }
      return `${info.level} ${info.timestamp} ${info.message} ${info.stack || ''}`
    })
  ),
  transports
})

module.exports = logger
