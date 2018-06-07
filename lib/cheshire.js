const _ = require('lodash')
const axios = require('axios')

const Contract = require('./contract.js')

class Cheshire {
  constructor(config) {
    this.config = config

    process.env.URL_CRYPTO_KITTIES_API = `http://localhost:${config.portApi}`
  }

  get accounts() {
    return this.config.accounts
  }

  contractAddress(contractName) { // eslint-disable-line class-methods-use-this
    return process.env[`ADDRESS_${_.snakeCase(contractName).toUpperCase()}`]
  }

  contractInstance(contractName) {
    return Contract.declaration(contractName).at(this.contractAddress(contractName))
  }

  async createKitty(matronId, sireId, generation, genes, owner, apiObject) {
    const params = {
      matronId,
      sireId,
      generation,
      genes,
      owner,
      apiObject,
    }

    return (await axios.post(`http://localhost:${this.config.portApi}/cheshire/kitties`, params)).data.kittyId
  }

  async deployContract(contractName, ...constructorArgs) {
    const params = {
      contractName,
      constructorArgs,
    }

    await axios.post(`http://localhost:${this.config.portApi}/cheshire/contracts`, params)

    return this.contractInstance(contractName)
  }

  async importKitty(kittyIdMainnet, ownerTestnet) {
    const params = {
      kittyIdMainnet,
      ownerTestnet,
    }

    return (await axios.post(`http://localhost:${this.config.portApi}/cheshire/kitties/import`, params)).data.kittyId
  }

  async importUser(addressMainnet, addressTestnet) {
    const params = {
      addressMainnet,
      addressTestnet,
    }

    return (await axios.post(`http://localhost:${this.config.portApi}/cheshire/users`, params)).data.address
  }

  async printHelp() {
    const { log } = console

    log('Available Accounts')
    log('====================')

    this.config.accounts.forEach((account, index) => log(`(${index}) ${account.address}`))

    log('')

    log('Private Keys')
    log('====================')

    this.config.accounts.forEach((account, index) => log(`(${index}) ${account.secretKey}`))

    log('')

    log('Testnet Contracts')
    log('====================')
    const contracts = Contract.addresses
    _.forOwn(contracts, (contractAddress, contractName) => {
      log(`${contractName}: ${contractAddress}`)
    })

    log('')

    log('Services')
    log('====================')
    log(`Ethereum testnet listening on port ${this.config.portTestnet}`)
    log(`CryptoKitties API listening on port ${this.config.portApi}`)
    log(`Cheshire dashboard available at http://localhost:${this.config.portApi}`)

    log('')
    log('View the above at any time by running `yarn run help`')
    log('')
  }
}

module.exports = Cheshire
