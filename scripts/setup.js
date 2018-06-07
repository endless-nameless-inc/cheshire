// `yarn start` runs setup.js by default. Use this script to start your dApp
// and seed it with test data.
const { exec } = require('child_process')

const { log } = console

module.exports = async function setup(cheshire) {
  // Deploy contract...
  // const myContract = await cheshire.deployContract('MyContract')
  // log('MyContract deployed at:', myContract.address)

  // Fetch Genesis kitty...
  const kittyIdGenesis = 1
  await cheshire.importKitty(kittyIdGenesis, cheshire.accounts[9].address)
  log(`Genesis kitty assigned to ${cheshire.accounts[9].address}`)

  // Start dApp...
  if (process.env.APP_START) {
    log('Running:', process.env.APP_START)
    log('====================')
    const child = exec(process.env.APP_START)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', log)
    child.on('close', code => log('Exited with code', code))
  } else {
    log(`
      *** NOTE: you can pass \`yarn start\` a command to start your app. We
      recommend you do this so your processes inherit the various environment
      variables set by Cheshire. For example:

        APP_START="cd ~/Projects/kittyrace-web; bundle exec rails server" yarn start
    `)
  }

  log('')
  log(`Done! Try fetching the Genesis kitty: curl ${process.env.URL_CRYPTO_KITTIES_API}/kitties/1`)
}
