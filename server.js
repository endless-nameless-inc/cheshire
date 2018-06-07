const fs = require('fs')
const ganache = require('ganache-cli')
const path = require('path')
const { exec } = require('child_process')

const Api = require('./api')
const Cheshire = require('./lib/cheshire.js')
const config = require('./config.json')
const Contract = require('./lib/contract.js')
const User = require('./lib/user.js')

const { log } = console

const Server = {
  startTestnet() {
    log('> Starting testnet...')

    ganache.server({
      accounts: config.accounts,
      // debug: true,
      // logger: console,
      // verbose: true,
    })
      .listen(config.portTestnet, (err) => {
        if (err) {
          log('Error starting Ganache:', err)
          process.exit(1)
        }
      })
  },

  async compileContracts() {
    log('> Compiling contracts...')

    return new Promise((resolve, reject) => {
      const child = exec('truffle compile')
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      child.on('error', log)
      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          log('Exited with code', code)
          reject()
        }
      })
    })
  },

  async deployContracts() {
    log('> Deploying CryptoKitties contracts to testnet...')

    const kittyCore = await Contract.deploy('KittyCore')
    const ownerCut = 375

    return {
      kittyCore: kittyCore.address,
      saleClockAuction: (await Contract.deploy('SaleClockAuction', kittyCore.address, ownerCut)).address,
      siringClockAuction: (await Contract.deploy('SiringClockAuction', kittyCore.address, ownerCut)).address,
    }
  },

  async startApiServer() {
    log('> Starting local CryptoKitties API server...')

    Api.listen(config.portApi)
  },

  async loadAccounts() {
    log('> Loading accounts')

    config.accounts.forEach(async (account, index) => {
      const apiObject = {
        address: account.address,
        nickname: `User #${index}`,
        image: '1',
      }

      await User.createUser(account.address, account.address, apiObject)
    })
  },

  async runSetupScript() {
    log('> Running setup script...')

    const scriptPath = path.join(process.cwd(), process.argv[2] || './scripts/setup.js')
    if (!fs.existsSync(scriptPath)) {
      log('Exiting, script not found:', scriptPath)
      process.exit(1)
    }

    const cheshire = new Cheshire(config)

    console.group()
    // eslint-disable-next-line global-require, import/no-dynamic-require
    await require(scriptPath)(cheshire)
    console.groupEnd()
  },

  async start() {
    await this.startTestnet()
    await this.compileContracts()
    await this.deployContracts()
    await this.startApiServer()
    await this.loadAccounts()
    await this.runSetupScript()

    log('')
    log('Cheshire is live 😺  Here\'s what\'s inside:')
    log('')

    await new Cheshire(config).printHelp()
  },
}

Server.start()
