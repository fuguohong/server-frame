/**
 * Created Date: 2020/10/15
 * Author: fgh
 * Description:
 */
'use strict'

const App = require('koa')

const app = new App()

app.use((ctx, next) => {
  if (ctx.path === '/health') {
    ctx.body = 'alu-diagnosis-assistant server'
    return
  }
  return next()
})

module.exports = app
