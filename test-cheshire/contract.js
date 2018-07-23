const fs = require('fs')

const Contract = require('../lib/contract.js')
const config = require('../config.json')

describe('contract', () => {
  it('addresses getter should return contract addresses from environment', () => {
    jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['ContractOne.sol', 'TextFile.txt'])

    process.env.ADDRESS_CONTRACT_ONE = '0x111'

    expect(Object.keys(Contract.addresses).length).toBe(1)
    expect(Contract.addresses.ContractOne).toBe('0x111')
  })

  it('contractDefaults should return reasonable defaults', () => {
    expect(Contract.contractDefaults).toEqual({
      from: config.accounts[0].address,
      gas: 6500000,
      gasPrice: 100000000000,
    })
  })

  it('declaration should return testnet contract declaration', () => {
    const declaration = Contract.declaration('KittyCore')

    expect(declaration.contractName).toBe('KittyCore')
    expect(declaration.currentProvider.host).toBe(`http://localhost:${config.portTestnet}`)
    expect(declaration.class_defaults).toEqual({
      from: config.accounts[0].address,
      gas: 6500000,
      gasPrice: 100000000000,
    })
  })

  it('declarationMainnet should return mainnet contract declaration', () => {
    const declaration = Contract.declarationMainnet('KittyCore')

    expect(declaration.contractName).toBe('KittyCore')
    expect(declaration.currentProvider.host).toBe(config.ethNodeMainnet)
  })

  it('deploy should deploy contracts to testnet', async () => {
    const mockNew = jest.fn().mockResolvedValue({ address: '0x112233' })
    Contract.declaration = jest.fn()
      .mockReturnValue({
        new: mockNew,
      })

    const instance = await Contract.deploy('TestContract')

    expect(instance.address).toBe('0x112233')
    expect(process.env.ADDRESS_TEST_CONTRACT).toBe('0x112233')
    expect(mockNew).toHaveBeenCalledTimes(1)
    expect(Contract.declaration).toHaveBeenCalledWith('TestContract')
  })

  it('deploy should deploy contracts having constructor arguments to testnet', async () => {
    const mockNew = jest.fn().mockResolvedValue({ address: '0x223344' })
    Contract.declaration = jest.fn()
      .mockReturnValue({
        new: mockNew,
      })

    const instance = await Contract.deploy('TestContract', 'arg 1')

    expect(instance.address).toBe('0x223344')
    expect(process.env.ADDRESS_TEST_CONTRACT).toBe('0x223344')
    expect(Contract.declaration).toHaveBeenCalledTimes(1)
    expect(Contract.declaration).toHaveBeenCalledWith('TestContract')
    expect(mockNew).toHaveBeenCalledTimes(1)
    expect(mockNew).toHaveBeenCalledWith('arg 1')
  })

  it('web3Provider should return testnet provider', () => {
    const provider = Contract.web3Provider
    expect(provider.host).toBe(`http://localhost:${config.portTestnet}`)
  })

  it('web3ProviderMainnet should return mainnet provider', () => {
    const provider = Contract.web3ProviderMainnet
    expect(provider.host).toBe(config.ethNodeMainnet)
  })
})
