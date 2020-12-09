/**
 * Created Date: 2020/8/28
 * Author: fgh
 * Description: 扩展seneca，使其支持异步使用
 */
'use strict'

const makeSeneca = require('seneca')
const BaseError = require('./baseError')
const { ERROR_CODES } = require('./consts')
const logger = require('./logger')
const _ = require('lodash')

const { Seneca } = makeSeneca

Seneca.prototype.addAsync = function (pattern, func) {
  return this.add(pattern, async function (msg, done) {
    try {
      logger.http(_.pick(msg, ['role', 'cmd', 'params']))
      const data = await func(msg)
      done(null, { code: 0, data })
    } catch (err) {
      let res = err
      if (!(err instanceof BaseError)) {
        delete err.transport$
        logger.error('服务内部错误', err)
        res = new BaseError('服务内部错误', ERROR_CODES.SERVER_ERROR)
      } else {
        logger.warn(err)
      }
      done(null, res.toJSON())
    }
  })
}

Seneca.prototype.actAsync = function (pattern, params) {
  return new Promise((resolve, reject) => {
    this.act(pattern, params, (err, res) => {
      if (err) {
        return reject(err)
      }
      return resolve(res)
    })
  })
}

Seneca.prototype.exec = function (role, cmd, params) {
  return this.actAsync({ role, cmd }, { params })
}

module.exports = makeSeneca
