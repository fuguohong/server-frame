/**
 * Created Date: 2020/12/9
 * Author: fgh
 * Description:
 */
'use strict'

const Sequelize = require('sequelize')
const loaders = require('./lib/loader')
const logger = require('./lib/logger')
const util = require('./lib/util')

const {mysql} = loaders.loadConfig()

const sequelize = new Sequelize({
  ...mysql,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: logger.verbose.bind(logger)
})

const initModel = Sequelize.Model.init

Sequelize.Model.init = function (fields, options) {
  return initModel.call(this, fields, {
    paranoid: true,
    underscored: true,
    timestamps: true,
    // freezeTableName: true,
    tableName: util.toLine(this.name),
    sequelize: sequelize,
    modelName: this.name,
    ...options
  })
}

loaders.loadModels()

for (const model of Object.values(sequelize.models)) {
  if (model.association) {
    model.association(sequelize.models)
  }
}

module.exports = {
  sequelize: sequelize,
  models: sequelize.models
}
