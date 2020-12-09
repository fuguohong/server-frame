/**
 * Created Date: 2020/8/27
 * Author: fgh
 * Description: service基类
 */
'use strict'
const { Op } = require('sequelize')
const { ERROR_CODES } = require('../lib/consts')
const BaseError = require('../lib/baseError')
const _ = require('lodash')
const { Model } = require('sequelize')
const J = require('joi')

const Joi = J.extend({
  type: 'string',
  base: J.string(),
  coerce (value) {
    if (typeof value === 'string' || typeof value === 'number') {
      return { value: value.toString() }
    }
    return undefined
  }
})

J.customJoi = Joi

const opKey = {}
for (const [k, v] of Object.entries(Op)) {
  opKey[`$${k}`] = v
}

const defaultValidateOpts = {
  abortEarly: true,
  allowUnknown: true,
  convert: true
}

const listParamSchema = Joi.object({
  page: Joi.number().integer().positive(),
  pageSize: Joi.number().integer().positive(),
  limit: Joi.number().integer().positive().default(10).max(10000),
  offset: Joi.number().integer().default(0),
  search: Joi.string(),
  searchFields: Joi.array().min(1)
}).with('page', ['pageSize'])
  .with('search', ['searchFields'])

const idSchema = Joi.object({
  id: Joi.number().integer().required()
})

class Service {
  /**
   * @param {object} context
   * @param {Model} model
   */
  constructor (context, model) {
    if (!model || Reflect.getPrototypeOf(model) !== Model) {
      throw new Error('model must be a instance of sequelize model')
    }
    this.ctx = context
    this.model = model
    // this.disableCmds = disableCmds || []
  }

  _validate (param, shcema, option) {
    const { value, error } = shcema.validate(param, {
      ...defaultValidateOpts,
      ...option
    })
    if (error) {
      throw new BaseError(error.message, ERROR_CODES.PARAM_ERROR)
    }
    return value
  }

  /**
   * 处理list api参数，使其符合查询格式。操作符使用$前缀即可。如 Op.in 用 $in表示，Op.or 用 $or表示
   * @param {int} [param.page]
   * @param {int} [param.pageSize]
   * @param {int} [param.limit] 默认10， page和offset形式选其一即可
   * @param {int} [param.offset] 默认0，
   * @param {string} [param.search] 搜索关键字,匹配模式为%${search}%
   * @param {array} [param.searchFields] 要搜索的字段
   * @param {array | object} [param.order] sequelize格式的array，或者 -a。默认排序id降序
   * @param {object} [param.include] 关联查询
   * @param {object} [param.where] 条件查询，如果不传where，则除了以上字段的其余字段会被当做条件查询
   */
  _parseListParam (param) {
    const query = this._validate(param, listParamSchema)

    let { limit, offset } = query
    if (query.pageSize) {
      limit = query.pageSize
      offset = (query.page - 1) * query.pageSize
    }

    let { where } = query
    if (!where) {
      where = _.omit(query, ['page', 'pageSize', 'limit', 'offset', 'search', 'searchFields', 'order', 'include'])
    }

    if (query.search) {
      if (query.searchFields.length > 1) {
        const or = query.searchFields.map((w) => ({
          [w]: { $like: `%${query.search}%` }
        }))
        if (where.$or) {
          where.$or = or.concat(where.$or)
        } else {
          where.$or = or
        }
      } else {
        where[query.searchFields[0]] = { $like: `%${query.search}%` }
      }
    }

    let order = query.order || [['id', 'DESC']]

    if (typeof order === 'string') {
      // '-a,b'格式
      const tmp = order.split(',')
      order = tmp.map((field) => {
        if (field.startsWith('-')) {
          return [field.slice(1), 'DESC']
        }
        return [field, 'ASC']
      })
    }

    return {
      limit,
      offset,
      order,
      where: this._parseQueryCondition(where),
      include: this._parseInclude(param).include
    }
  }

  _parseQueryCondition (opt) {
    if (Array.isArray(opt)) {
      return opt.map((o) => this._parseQueryCondition(o))
    }
    if (opt && typeof opt === 'object') {
      const result = {}
      for (const [k, v] of Object.entries(opt)) {
        const key = opKey[k] || k
        result[key] = this._parseQueryCondition(v)
      }
      return result
    }
    return opt
  }

  _parseInclude (param) {
    if (param.include && typeof param.include === 'string') {
      param.include = param.include.split(',')
    }
    return param
  }

  bulkCreate (modelArray) {
    return this.model.bulkCreate(modelArray)
  }

  create (data) {
    return this.model.create(data)
  }

  async findByPk (query) {
    const { id, include } = this._parseInclude(this._validate(query, idSchema))
    const result = await this.model.findByPk(id, { include })
    if (!result) {
      throw new BaseError(`${this.model.name} not found`, ERROR_CODES.NOT_FOUND)
    }
    return result
  }

  async update (data) {
    const param = this._validate(data, idSchema)
    const dbinst = await this.findByPk({ id: param.id })
    await dbinst.update(data)
    return dbinst
  }

  async destroy (data) {
    const param = this._validate(data, idSchema)
    const dbinst = await this.findByPk({ id: param.id })
    await dbinst.destroy()
    return dbinst
  }

  async list (param) {
    const query = this._parseListParam(param)
    const result = await this.model.findAndCountAll(query)
    return {
      items: result.rows,
      total: result.count,
      offset: query.offset,
      limit: query.limit,
      page: (query.offset / query.limit) + 1,
      pageSize: query.limit
    }
  }

  find (param) {
    param.where = this._parseQueryCondition(param.where)
    if (!param.limit) {
      param.limit = 10000
    }
    if (param.limit > 10000) {
      throw new BaseError('limit 最大允许10000', ERROR_CODES.PARAM_ERROR)
    }
    return this.model.findAll(param)
  }

  findOne (param) {
    param.where = this._parseQueryCondition(param.where)
    return this.model.findOne(param)
  }

  count (param) {
    param.where = this._parseQueryCondition(param.where)
    return this.model.count(param)
  }
}

module.exports = Service
