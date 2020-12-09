/**
 * Created Date: 2020/12/9
 * Author: fgh
 * Description:
 */
'use strict'

const path = require('path')
const glob = require('glob')

const cwd = process.cwd()

let config = null
exports.loadConfig = function () {
  if(!config){
    const env = process.env.ALU_SERVER_ENV || process.env.NODE_ENV
    const envConfigPath = path.join(cwd, `src/config/config.${env}.js`)

    if (!fs.existsSync(envConfigPath)) {
      throw new Error('config file not found，ENV： ' + env)
    }

    const initConfig = require('../config.default')
    let defaultConfig = require(path.join(cwd, 'src/config/config.default.js'))
    defaultConfig = Object.assign({},initConfig, defaultConfig)
    const envConfig = require(envConfigPath)

    let config
    if (typeof envConfig === 'function') {
      config = envConfig(defaultConfig)
    } else {
      config = Object.assign(defaultConfig, envConfig)
    }

    config.isProd = config.env === 'production'
  }
  return config
}

let models = null
exports.loadModels = function () {
  if(!models){
    models = {}
    glob.sync(path.join(cwd, 'src/components/**/*[mM]odel.js')).forEach(f=>{
      const modelClass = require(f)
      models[modelClass.name] = modelClass
    })
  }
  return models
}

let services = null
exports.loadServices = function () {
  if (!services) {
    services = {}
    glob.sync(path.join(cwd, 'src/components/**/*[sS]ervice.js')).forEach(f => {
      const serviceClass = require(f)
      services[serviceClass.name] = serviceClass
    })
  }
  return services
}


let resolvers = null
exports.loadResolver = function () {
  if(!resolvers){
    resolvers = glob.sync(path.join(cwd, 'src/components/**/*[rR]esolver.js'))
    .map(require)
  }
  return resolvers
}

let types = null
exports.loadTypes = function () {
  if(!types){
    types = glob.sync(path.join(cwd, 'src/components/**/*.gql'))
    .map(f => {
      return fs.readFileSync(f, { encoding: 'utf8' })
    })
  }
  return types
}
