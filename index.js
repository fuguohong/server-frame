/**
 * Created Date: 2020/10/15
 * Author: fgh
 * Description:
 */
'use strict'

module.exports = {
  BaseService: require('./lib/baseService'),
  BaseError: require('./lib/baseError'),
  logger: require('./lib/logger'),
  util: require('./lib/util'),
  ...require('./db'),
  httpServer: require('./httpServer'),
  seneca: require('./seneca'),
  gqlServer: require('./gqlServer')
}
