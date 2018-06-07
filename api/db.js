const sqlite3 = require('sqlite3')

const db = new sqlite3.Database(':memory:')

db.serialize(() => {
  db.run('CREATE TABLE kitties (id_mainnet integer, id_testnet integer, owner string, api_object BLOB)')
  db.run('CREATE TABLE users (address_mainnet string, address_testnet string, api_object BLOB)')
})

module.exports = db
