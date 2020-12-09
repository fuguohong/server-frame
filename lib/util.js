/**
 * Created Date: 2020/9/3
 * Author: fgh
 * Description:
 */
'use strict'
const Service = require('./baseService')
const glob = require('glob')
const path = require('path')

exports.toLine = function (name) {
  if (!name) {
    return ''
  }
  const tmp = name.replace(/([A-Z])/g, '_$1').toLowerCase()
  if (tmp[0] === '_') {
    return tmp.slice(1)
  }
  return tmp
}

exports.StringBuilder = class StringBuilder {
  constructor (size) {
    this.capacity = size || 256
    this.buffer = Buffer.alloc(this.capacity)
    this.offset = 0
  }

  write (str) {
    const offset = this.offset
    this.offset = this.offset + Buffer.byteLength(str)
    if (this.offset > this.capacity) {
      this.buffer = Buffer.concat([this.buffer], this.offset * 2)
    }
    this.buffer.write(str, offset)
  }

  string () {
    return this.buffer.slice(0, this.offset).toString()
  }
}

exports.getCmds = function (service) {
  const funcs = new Set()
  const disableCmds = service.disableCmds || []
  let lastConstructor = null
  let proto = service.prototype
  while (lastConstructor !== Service && proto.constructor !== Object) {
    for (const key of Reflect.ownKeys(proto)) {
      if (!key.startsWith('_') && typeof proto[key] === 'function' && !disableCmds.includes(key)) {
        funcs.add(key)
      }
    }
    lastConstructor = proto.constructor
    proto = Reflect.getPrototypeOf(proto)
  }
  funcs.delete('constructor')
  funcs.delete('model')
  return funcs
}

