// yarn run mine <num blocks>

const Web3 = require('web3')
const config = require('../config.json')

const { log } = console

module.exports = async function mineBlocks() {
  const mineBlock = () => new Promise((resolve, reject) => {
    new Web3.providers.HttpProvider(`http://localhost:${config.portTestnet}`).sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: 12345,
    }, (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve(result)
    })
  })

  let numBlocks = parseInt(process.argv.slice().pop(), 10)
  if (Number.isNaN(numBlocks) || numBlocks < 1) {
    numBlocks = 1
  }

  log(`Mining ${numBlocks} blocks...`)

  const promises = []
  for (let i = 0; i < numBlocks; i += 1) {
    promises.push(mineBlock())
  }
  await Promise.all(promises)

  log('Done')
}
