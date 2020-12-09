/**
 * Created Date: 2020/10/15
 * Author: fgh
 * Description:
 */
'use strict'

const { ERROR_CODES } = require('./consts')

class BaseError extends Error {
  constructor (message, code) {
    super(message)
    this.code = code
  }

  toJSON () {
    return {
      code: this.code,
      message: this.message
    }
  }
}

BaseError.ERROR_CODES = ERROR_CODES

module.exports = BaseError
