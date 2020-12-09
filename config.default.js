/**
 * Created Date: 2020/12/9
 * Author: fgh
 * Description:
 */
'use strict'

const path = require('path')


const cwd = process.cwd()
const pkg = require(path.join(cwd,'package.json'))

const config = {
  cwd: cwd,
  name: pkg.name,

  log: {
    writeFile: true,
    console: true,
    logLevel: process.env.LOG_LEVEL || 'http',
    consoleLevel: process.env.CONSOLE_LEVEL || 'http',
    logDir: path.join(cwd, 'logs')
  }
}

module.exports = config
