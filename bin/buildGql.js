#!/usr/bin/env node

process.env.ALU_SERVER_ENV = 'dev'

const Sequelize = require('sequelize')
const sequelize2gql = require('../lib/sequelize2gql')
const fs = require('fs')
const path = require('path')

const sequelize = new Sequelize()
const initModel = Sequelize.Model.init
Sequelize.Model.init = function (fields, options) {
  return initModel.call(this, fields, {
    paranoid: true,
    underscored: true,
    timestamps: true,
    // freezeTableName: true,
    sequelize: sequelize,
    modelName: this.name,
    ...options
  })
}

const { models } = require('../lib/loader').loadModels()

let mds = models
const root = process.cwd()
let outdir = process.argv[2] || 'dist'
outdir = path.join(root, outdir)

const modelName = process.argv[3]

if (modelName) {
  if (!models[modelName]) {
    console.error('未知的model名称', modelName)
    process.exit(1)
  }
  mds = { [modelName]: models[modelName] }
}

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir)
}

for (const [k, v] of Object.entries(mds)) {
  const fName = path.join(outdir, k[0].toLowerCase() + k.slice(1) + '.gql')
  fs.writeFileSync(fName, sequelize2gql(v))
}
