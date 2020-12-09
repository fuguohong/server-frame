/**
 * Created Date: 2020/10/15
 * Author: fgh
 * Description:
 */
'use strict'

const { ApolloServer, mergeSchemas } = require('apollo-server-koa')

const { baseError: BaseError, logger, context, loader } = require('./lib')
const app = require('./httpServer')

const { isProd } = loader.loadConfig()

const resolvers = loader.loadResolver()

const types = loader.loadTypes()

const gqlServer = new ApolloServer({
  // typeDefs: types,
  // resolvers: resolvers,
  schema: mergeSchemas({
    schemas: types,
    resolvers: resolvers
  }),
  playground: {
    settings: {
      'schema.polling.enable': false
    }
  },
  formatError: (err) => {
    while (err.originalError) {
      err = err.originalError
    }
    if (err.name === 'GraphQLError') {
      logger.warn(err.message)
      return {
        code: BaseError.ERROR_CODES.PARAM_ERROR,
        message: err.message
      }
    } else if (err instanceof BaseError) {
      logger.warn(err)
      return err.toJSON()
    } else {
      logger.error(err)
      return {
        code: BaseError.ERROR_CODES.SERVER_ERROR,
        message: isProd ? '服务器内部错误' : err.message
      }
    }
  },
  context: ctx => {
    return context.buildFromGql(ctx.ctx)
  }
})

gqlServer.applyMiddleware({ app })

module.exports = gqlServer
