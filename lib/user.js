const axios = require('axios')
const Kitty = require('./kitty.js')

class User {
  static async count() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) FROM users', (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row['COUNT(*)'])
        }
      })
    })
  }

  static createUser(addressMainnet, addressTestnet, apiObject) {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO users (address_mainnet, address_testnet, api_object) VALUES (?, ?, ?)', addressMainnet, addressTestnet, JSON.stringify(apiObject), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(addressTestnet)
        }
      })
    })
  }

  static async fetchAttrsApi(address) {
    return (await axios.get(`https://api.cryptokitties.co/user/${address}`)).data
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  static async findByAddress(address) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE address_testnet=?', address, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  static async importUser(addressMainnet, addressTestnet) {
    const attrsApi = await this.fetchAttrsApi(addressMainnet)
    attrsApi.address = addressTestnet

    this.db.run('UPDATE users SET address_mainnet=?, api_object=? WHERE address_testnet=?', addressMainnet, JSON.stringify(attrsApi), addressTestnet)

    const { kitties } = (await axios.get(`https://api.cryptokitties.co/kitties?owner_wallet_address=${addressMainnet}`)).data

    // Need to import kitties in serial because the kitty ID "predicted" by
    // `createKitty.call()` lags so far behind the actual `createKitty`
    // transaction that we almost always get duplicate/inaccurate kitty IDs
    // in the database.
    //
    // Potential solution: drive kitty INSERTS with the `Birth` event.
    //
    // eslint-disable-next-line no-restricted-syntax
    for (const kitty of kitties) {
      await Kitty.importKitty(kitty.id, addressTestnet) // eslint-disable-line no-await-in-loop
    }

    return addressTestnet
  }
}

User.db = require('../api/db.js')

module.exports = User
