const config = require('./config.json')

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    cheshire: {
      host: 'localhost',
      port: config.portTestnet,
      network_id: 1337,
    },
  },
}
