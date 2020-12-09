/**
 * Created Date: 2020/10/15
 * Author: fgh
 * Description:
 */
'use strict'

const fs = require('fs')
const path = require('path')

fs.readdirSync(__dirname)
  .filter(f => f !== 'index.js')
  .forEach(f => {
    const name = f.slice(0, -3)
    exports[name] = require(path.join(__dirname, f))
  })
