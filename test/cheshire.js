const axios = require('axios')

const Cheshire = require('../lib/cheshire.js')
const config = require('../config.json')
const Contract = require('../lib/contract.js')

const cheshire = new Cheshire(config)

describe('cheshire', () => {
  it('constructor should set URL_CRYPTO_KITTIES_API env var', () => {
    expect(process.env.URL_CRYPTO_KITTIES_API).toBe('http://localhost:4000')
  })

  it('accounts getter should return accounts defined in config', () => {
    expect(cheshire.accounts).toEqual(config.accounts)
    expect(cheshire.accounts.length).toBe(10)
    expect(cheshire.accounts[0].address).toBe('0x182fc09c33fdd6c2f5b2562f3ca721fa954689c8')
  })

  it('contractAddress should return given contract address', () => {
    process.env.ADDRESS_TEST = '0x123'

    expect(cheshire.contractAddress('test')).toBe('0x123')
  })

  it('contractInstance should return instance of given contract', () => {
    const mockAt = jest.fn().mockReturnValue({ address: '0x777' })
    Contract.declaration = jest.fn()
      .mockReturnValue({
        at: mockAt,
      })
    cheshire.contractAddress = jest.fn().mockReturnValue('0x777')

    const instance = cheshire.contractInstance('TestContract')

    expect(instance.address).toBe('0x777')
    expect(Contract.declaration).toHaveBeenCalledTimes(1)
    expect(Contract.declaration).toHaveBeenCalledWith('TestContract')
    expect(mockAt).toHaveBeenCalledTimes(1)
    expect(mockAt).toHaveBeenCalledWith('0x777')
  })

  it('deployContract should POST to /cheshire/contracts', async () => {
    axios.post = jest.fn()
      .mockReturnValue({ data: { address: '0x001122' } })

    jest
      .spyOn(cheshire, 'contractInstance')
      .mockReturnValue({ address: '0x001122' })

    const contractInstance = await cheshire.deployContract('TestContract')

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:${config.portApi}/cheshire/contracts`,
      {
        contractName: 'TestContract',
        constructorArgs: [],
      },
    )
    expect(contractInstance.address).toBe('0x001122')
  })

  it('createKitty should POST to /cheshire/kitties', async () => {
    axios.post = jest.fn().mockReturnValue({ data: { kittyId: 123 } })

    const kittyId = await cheshire.createKitty(
      1, // matronId
      2, // sireId
      3, // generation
      4, // genes
      '0x123', // owner
      { name: 'cheshire' }, // apiObject
    )

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:${config.portApi}/cheshire/kitties`,
      {
        matronId: 1,
        sireId: 2,
        generation: 3,
        genes: 4,
        owner: '0x123',
        apiObject: { name: 'cheshire' },
      },
    )
    expect(kittyId).toBe(123)
  })

  it('importKitty should POST to /cheshire/kitties/import', async () => {
    axios.post = jest.fn().mockReturnValue({ data: { kittyId: 1 } })

    const kittyIdTestnet = await cheshire.importKitty(101, config.accounts[0].address)

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:${config.portApi}/cheshire/kitties/import`,
      {
        kittyIdMainnet: 101,
        ownerTestnet: config.accounts[0].address,
      },
    )
    expect(kittyIdTestnet).toBe(1)
  })

  it('importUser should POST to /cheshire/users', async () => {
    axios.post = jest.fn().mockReturnValue({ data: { address: '0x234' } })

    const addressTestnet = await cheshire.importUser('0x123', '0x234')

    expect(addressTestnet).toBe('0x234')
    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post).toHaveBeenCalledWith(
      `http://localhost:${config.portApi}/cheshire/users`,
      {
        addressMainnet: '0x123',
        addressTestnet: '0x234',
      },
    )
  })

  it('prints help', async () => {
    global.console.log = jest.fn()

    cheshire.printHelp()

    const helpText = console.log.mock.calls.map(call => call[0]).join('')

    expect(helpText).toMatch(/Available Accounts/)
    expect(helpText).toMatch(/\(0\) 0x182fc09c33fdd6c2f5b2562f3ca721fa954689c8/)

    expect(helpText).toMatch(/Private Keys/)
    expect(helpText).toMatch(/\(0\) 0x76a67ae288fd67ea8d4f7fb94f50c36b606d9448db579584af90d52105f9d8cf/)

    expect(helpText).toMatch(/Testnet Contracts/)
    expect(helpText).toMatch(/KittyCore/)
    expect(helpText).toMatch(/SaleClockAuction/)
    expect(helpText).toMatch(/SiringClockAuction/)

    expect(helpText).toMatch(/Services/)
    expect(helpText).toMatch(/Ethereum testnet.*port 8545/)
    expect(helpText).toMatch(/CryptoKitties API.*http:\/\/localhost:4000/)
  })
})
