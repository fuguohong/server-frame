#!/usr/bin/env node



const { sequelize } = require('../db')
const seneca = require('../seneca')
const server = require('../httpServer')
require('../gqlServer')
const { logger,loader } = require('../lib')

const config = loader.loadConfig()

async function main () {
  logger.info('服务启动环境：' + config.env)
  await sequelize.sync()
  logger.info('数据库同步完成')
  seneca.listen({
    port: config.seneca.port,
    timeout: config.seneca.timeout,
    type: 'http'
  })
  logger.info('seneca 监听端口：' + config.seneca.port)
  server.listen(config.webPort)
  logger.info('http服务监听端口:' + config.webPort)
}

main().catch(err => {
  logger.error('服务启动失败', err)
  process.exit(1)
})
