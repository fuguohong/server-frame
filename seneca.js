/**
 * Created Date: 2020/12/9
 * Author: fgh
 * Description:
 */
'use strict'

const makeSeneca = require('./lib/asyncSeneca')
const context = require('./lib/context')
const loader = require('./lib/loader')
const util = require('./lib/util')
const { seneca: senecaConfig } = loader.loadConfig()

const seneca = makeSeneca({ tag: senecaConfig.role, log: { level: 'none' } })

module.exports = seneca

const services = loader.loadServices()
for (const [k, v] of Object.entries(services)) {
  const cmds = util.getCmds(v)
  for (const cmd of cmds) {
    seneca.addAsync({ role: `${senecaConfig.role}.${k}`, cmd }, (msg) => {
      const ctx = context.buildFromSeneca(msg)
      const service = new services[k](ctx)
      return service[cmd](msg.params)
    })
  }
}

if (senecaConfig.services) {
  for (const v of Object.values(senecaConfig.services)) {
    const tmp = v.split(':')
    seneca.client({
      host: tmp[0],
      port: tmp[1],
      timeout: senecaConfig.timeout
    })
  }
}
