/**
 * Created Date: 2020/10/16
 * Author: fgh
 * Description:
 */
'use strict'
const crypto = require('crypto')
const BaseError = require('./baseError')
const loader = require('./loader')
const seneca = require('../seneca')
const logger = require('./logger')

const serviceMap = loader.loadServices()

function serviceProxy (ctx) {
  const cache = {}
  return new Proxy(serviceMap, {
    get: function (target, key) {
      if (!cache[key]) {
        const Service = target[key]
        if (!Service) {
          throw new Error('service not defined ' + key)
        }
        cache[key] = new Service(ctx)
      }
      return cache[key]
    },
    set: function () {
      throw new Error('context service can not set')
    }
  })
}

class Context {
  constructor () {
    this.id = crypto.randomBytes(16).toString('hex')
    this.startTs = Date.now()
    this.type = ''
    this.accessToken = ''
    this.gqlContext = null
    this.service = serviceProxy(this)
    this.clientIp = ''
    this.seneaMsg = null
    this.seneca = seneca
    this.logger = logger
  }

  throw (message, code) {
    code = code || BaseError.ERROR_CODES.INVALID_OPERATE
    throw new BaseError(message, code)
  }

  async getUser () {
    if (!this._user) {
      throw new Error('实现获取登陆用户信息')
    }
    return this._user
  }
}

Context.buildFromGql = (gqlCtx) => {
  const ctx = new Context()
  ctx.gqlContext = gqlCtx
  ctx.accessToken = gqlCtx.req.headers['X-AccessToken']
  ctx.clientIp = gqlCtx.req.headers['remote-address'] || gqlCtx.req.connection.remoteAddress
  return ctx
}

Context.buildFromSeneca = msg => {
  const ctx = new Context()
  ctx.seneaMsg = msg
  return ctx
}

module.exports = Context
