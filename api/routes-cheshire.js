const fs = require('fs')
const path = require('path')
const Router = require('koa-router')

const Contract = require('../lib/contract.js')
const Kitty = require('../lib/kitty.js')
const User = require('../lib/user.js')

module.exports = new Router()
  .get('/', (ctx) => {
    ctx.body = fs.readFileSync(path.join(__dirname, './static/dashboard.html')).toString()
  })
  .get('/cheshire/contracts', (ctx) => {
    ctx.body = Contract.addresses
  })
  .post('/cheshire/contracts', async (ctx) => {
    const { contractName, constructorArgs } = ctx.request.body
    const contract = await Contract.deploy(contractName, ...constructorArgs)

    ctx.body = {
      address: contract.address,
    }
  })
  .post('/cheshire/kitties', async (ctx) => {
    const {
      matronId,
      sireId,
      generation,
      genes,
      owner,
      apiObject,
    } = ctx.request.body

    const kittyId = await Kitty.createKitty(matronId, sireId, generation, genes, owner, apiObject)

    ctx.body = {
      kittyId,
    }
  })
  .post('/cheshire/kitties/import', async (ctx) => {
    const { kittyIdMainnet, ownerTestnet } = ctx.request.body
    const kittyId = await Kitty.importKitty(kittyIdMainnet, ownerTestnet)

    ctx.body = {
      kittyId,
    }
  })
  .get('/cheshire/users', async (ctx) => {
    const users = (await User.findAll(ctx.query.owner_wallet_address))
      .map(row => JSON.parse(row.api_object))

    ctx.body = {
      users,
    }
  })
  .post('/cheshire/users', async (ctx) => {
    const { addressMainnet, addressTestnet } = ctx.request.body

    await User.importUser(addressMainnet, addressTestnet)

    ctx.body = {
      address: addressTestnet,
    }
  })
