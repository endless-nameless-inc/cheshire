const axios = require('axios')

const config = require('../config.json')
const Contract = require('./contract.js')

class Kitty {
  static count(ownerWalletAddress) {
    return new Promise((resolve, reject) => {
      // TODO: use query builder
      const sql = ownerWalletAddress
        ? ['SELECT COUNT(*) FROM kitties WHERE LOWER(owner)=LOWER(?)', ownerWalletAddress]
        : ['SELECT COUNT(*) FROM kitties']

      this.db.get(...sql, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row['COUNT(*)'])
        }
      })
    })
  }

  static async createKitty(matronId, sireId, generation, genes, owner, apiObject) {
    const kittyCore = Contract.declaration('KittyCore').at(process.env.ADDRESS_KITTY_CORE)

    const kittyId = parseInt(await kittyCore.createKitty.call(
      matronId,
      sireId,
      generation,
      genes,
      owner,
      { value: 0, gas: 500000, gasPrice: 10000000000 } // eslint-disable-line comma-dangle
    ), 10)

    await kittyCore.createKitty(
      matronId,
      sireId,
      generation,
      genes,
      owner,
      { value: 0, gas: 500000, gasPrice: 10000000000 } // eslint-disable-line comma-dangle
    )

    const apiObjectTestnet = apiObject
    apiObjectTestnet.id = kittyId
    if (!apiObjectTestnet.owner) {
      apiObjectTestnet.owner = {}
    }
    apiObjectTestnet.owner.address = owner

    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO kitties (id_testnet, owner, api_object) VALUES (?, ?, ?)', kittyId, owner, JSON.stringify(apiObjectTestnet), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(kittyId)
        }
      })
    })
  }

  static async fetchAttrsApi(kittyId) {
    return (await axios.get(`https://api.cryptokitties.co/kitties/${kittyId}`)).data
  }

  static async fetchAttrsChain(kittyId) {
    const kittyCoreMainnet = Contract.declarationMainnet('KittyCore').at(config.addressKittyCoreMainnet)
    const [
      isGestating,
      isReady,
      cooldownIndex,
      nextActionAt,
      siringWithId,
      birthTime,
      matronId,
      sireId,
      generation,
      genes,
    ] = await kittyCoreMainnet.getKitty(kittyId)

    return {
      isGestating,
      isReady,
      cooldownIndex,
      nextActionAt,
      siringWithId,
      birthTime,
      matronId,
      sireId,
      generation,
      genes,
    }
  }

  static findAll(ownerWalletAddress, limit, offset) {
    return new Promise((resolve, reject) => {
      // TODO: use query builder
      const sql = ownerWalletAddress
        ? ['SELECT api_object FROM kitties WHERE LOWER(owner) = LOWER(?) LIMIT ? OFFSET ?', ownerWalletAddress, limit, offset]
        : ['SELECT api_object FROM kitties LIMIT ? OFFSET ?', limit, offset]

      this.db.all(...sql, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM kitties WHERE id_testnet=?', id, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  static async importKitty(kittyIdMainnet, ownerTestnet) {
    const attrsChain = await this.fetchAttrsChain(kittyIdMainnet)
    const attrsApi = await this.fetchAttrsApi(kittyIdMainnet)

    const kittyId = await this.createKitty(
      attrsChain.matronId,
      attrsChain.sireId,
      attrsChain.generation,
      attrsChain.genes,
      ownerTestnet,
      attrsApi,
    )

    return kittyId
  }
}

Kitty.db = require('../api/db.js')

module.exports = Kitty
