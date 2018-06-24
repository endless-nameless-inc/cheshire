// Routes in this file map to the public CryptoKitties API.
const Router = require('koa-router')

const Kitty = require('../lib/kitty.js')
const User = require('../lib/user.js')

module.exports = new Router()
  .get('/kitties/:id', async (ctx) => {
    const kitty = await Kitty.findById(parseInt(ctx.params.id, 10))

    if (kitty === undefined) {
      ctx.status = 404
    } else {
      ctx.body = JSON.parse(kitty.api_object)
    }
  })
  .get('/kitties', async (ctx) => {
    const limit = ctx.query.limit ? parseInt(ctx.query.limit, 10) : 12
    const offset = ctx.query.offset ? parseInt(ctx.query.offset, 10) : 0
    const kitties = (await Kitty.findAll(ctx.query.owner_wallet_address, limit, offset))
      .map(row => JSON.parse(row.api_object))
    const total = await Kitty.count(ctx.query.owner_wallet_address)

    ctx.body = {
      limit,
      offset,
      kitties,
      total,
    }
  })
  .get('/user/:address', async (ctx) => {
    const user = await User.findByAddress(ctx.params.address)

    if (user === undefined) {
      ctx.status = 404
      ctx.body = { error: 'user not found' }
    } else {
      ctx.body = JSON.parse(user.api_object)
    }
  })
