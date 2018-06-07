const _ = require('lodash')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const config = require('../config.json')
const Cheshire = require('../lib/cheshire.js')

const { log } = console

async function setEnvironmentVariables() {
  try {
    const contracts = (await axios.get(`http://localhost:${config.portApi}/cheshire/contracts`)).data

    _.forOwn(contracts, (contractAddress, contractName) => {
      process.env[`ADDRESS_${_.snakeCase(contractName).toUpperCase()}`] = contractAddress
    })
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      log(`
        ** NOTE: Cheshire API server not running. Could not set contract address environment variables
      `)
    } else {
      throw e
    }
  }
}

async function run() {
  const scriptPath = path.join(process.cwd(), process.argv[2])
  if (!fs.existsSync(scriptPath)) {
    log(`ERROR: the file ${scriptPath} does not exist`)
    process.exit(1)
  }

  await setEnvironmentVariables()
  const cheshire = new Cheshire(config)

  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(scriptPath)(cheshire, ...process.argv.slice(3))
}

run()
