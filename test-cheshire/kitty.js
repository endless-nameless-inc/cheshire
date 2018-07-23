const axios = require('axios')

const Contract = require('../lib/contract.js')
const Kitty = require('../lib/kitty.js')

describe('kitty', () => {
  beforeEach(() => {
    Kitty.db.serialize(() => {
      Kitty.db.run('DELETE FROM kitties')
      Kitty.db.run('INSERT INTO kitties (id_mainnet, id_testnet, owner, api_object) VALUES (?, ?, ?, ?)', 1, 1, '0x123', JSON.stringify({ name: 'Snowball I' }))
      Kitty.db.run('INSERT INTO kitties (id_mainnet, id_testnet, owner, api_object) VALUES (?, ?, ?, ?)', 2, 2, '0x123', JSON.stringify({ name: 'Snowball II' }))
      Kitty.db.run('INSERT INTO kitties (id_mainnet, id_testnet, owner, api_object) VALUES (?, ?, ?, ?)', 3, 3, '0x123', JSON.stringify({ name: 'Snowball III' }))
      Kitty.db.run('INSERT INTO kitties (id_mainnet, id_testnet, owner, api_object) VALUES (?, ?, ?, ?)', 4, 4, '0x444', JSON.stringify({ name: 'Furball I' }))
    })
  })

  afterAll(() => {
    Kitty.db.close()
  })

  it('count should return total number of kitties in database', async () => {
    const count = await Kitty.count()
    expect(count).toBe(4)
  })

  it('count should return total number of kitties owned by address', async () => {
    const count = await Kitty.count('0x123')
    expect(count).toBe(3)
  })

  it('count should handle database errors', async () => {
    jest
      .spyOn(Kitty.db, 'get')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(Kitty.count()).rejects.toEqual('DB Error!')
  })

  it('fetchAttrsApi should retrieve data from the production CryptoKitties API', async () => {
    axios.get = jest.fn().mockReturnValue({
      data: {
        id: 123,
        name: 'Cheshire',
      },
    })

    const attrs = await Kitty.fetchAttrsApi(123)
    expect(attrs).toEqual({
      id: 123,
      name: 'Cheshire',
    })
    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith('https://api.cryptokitties.co/kitties/123')
  })

  it('fetchAttrsChain should retrieve data from the production KittyCore contract', async () => {
    const getKittyMock = jest.fn().mockReturnValue([
      false, // isGestating
      true, // isReady
      0, // cooldownIndex
      0, // nextActionAt
      0, // siringWithId
      1511111111, // birthTime
      0, // matronId
      0, // sireId
      3, // generation
      123456789, // genes
    ])
    Contract.declarationMainnet = jest.fn().mockReturnValue({
      at: jest.fn().mockReturnValue({
        getKitty: getKittyMock,
      }),
    })

    const attrs = await Kitty.fetchAttrsChain(123)

    expect(attrs).toEqual({
      birthTime: 1511111111,
      cooldownIndex: 0,
      generation: 3,
      genes: 123456789,
      isGestating: false,
      isReady: true,
      matronId: 0,
      nextActionAt: 0,
      sireId: 0,
      siringWithId: 0,
    })
    expect(getKittyMock).toHaveBeenCalledTimes(1)
    expect(getKittyMock).toHaveBeenCalledWith(123)
  })

  it('findAll should return all kitties associated with an address', async () => {
    const kitties = await Kitty.findAll('0x123', 12, 0)
    expect(kitties.length).toBe(3)
    expect(kitties[0].api_object).toBeDefined()
  })

  it('findAll should handle database errors', async () => {
    jest
      .spyOn(Kitty.db, 'all')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(Kitty.findAll('0x123', 12, 0)).rejects.toEqual('DB Error!')
  })

  it('findAll should return an empty array when no kitties are found', async () => {
    const kitties = await Kitty.findAll('0x234', 12, 0)
    expect(kitties.length).toBe(0)
  })

  it('findAll should return all kitties when no owner filter is given', async () => {
    const kitties = await Kitty.findAll(null, 12, 0)
    expect(kitties.length).toBe(4)
  })

  it('findById should return a kitty given its ID', async () => {
    const kitty = await Kitty.findById(1)
    expect(kitty.api_object).toBeDefined()
  })

  it('findById should return undefined when a kitty matching ID does not exist', async () => {
    const kitty = await Kitty.findById(999)
    expect(kitty).toBeUndefined()
  })

  it('findById should handle database errors', async () => {
    jest
      .spyOn(Kitty.db, 'get')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(Kitty.findById(123)).rejects.toEqual('DB Error!')
  })

  it('createKitty should add a kitty to testnet KittyCore and the local database', async () => {
    const coreCreateKittyMock = jest.fn().mockReturnValue(23)
    Contract.declaration = jest.fn().mockReturnValue({
      at: jest.fn().mockReturnValue({
        createKitty: coreCreateKittyMock,
      }),
    })

    const kittyId = await Kitty.createKitty(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x123', // owner
      { name: 'cheshire', owner: { address: '0x123' } }, // apiObject
    )

    expect(kittyId).toBe(23)
    expect(coreCreateKittyMock).toHaveBeenCalledTimes(2)
    expect(coreCreateKittyMock).toHaveBeenCalledWith(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x123', // owner
      {
        gas: 500000,
        gasPrice: 10000000000,
        value: 0,
      },
    )

    const kitty = await Kitty.findById(kittyId)
    expect(kitty.owner).toBe('0x123')
    expect(JSON.parse(kitty.api_object).owner.address).toBe('0x123')
  })

  it('createKitty should add an owner attribute to apiObject if missing', async () => {
    const coreCreateKittyMock = jest.fn().mockReturnValue(23)
    Contract.declaration = jest.fn().mockReturnValue({
      at: jest.fn().mockReturnValue({
        createKitty: coreCreateKittyMock,
      }),
    })

    const kittyId = await Kitty.createKitty(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x123', // owner
      { name: 'cheshire' }, // apiObject
    )

    expect(kittyId).toBe(23)
    expect(coreCreateKittyMock).toHaveBeenCalledTimes(2)
    expect(coreCreateKittyMock).toHaveBeenCalledWith(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x123', // owner
      {
        gas: 500000,
        gasPrice: 10000000000,
        value: 0,
      },
    )

    const kitty = await Kitty.findById(kittyId)
    expect(kitty.owner).toBe('0x123')
    expect(JSON.parse(kitty.api_object).owner.address).toBe('0x123')
  })

  it('createKitty should handle database errors', async () => {
    const coreCreateKittyMock = jest.fn().mockReturnValue(4)
    Contract.declaration = jest.fn().mockReturnValue({
      at: jest.fn().mockReturnValue({
        createKitty: coreCreateKittyMock,
      }),
    })

    jest
      .spyOn(Kitty.db, 'run')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    await expect(Kitty.createKitty(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x123', // owner
      { name: 'cheshire' }, // attrs
    )).rejects.toEqual('DB Error!')
  })

  it('importKitty should create kitty with mainnet/production KittyCore and API data', async () => {
    Kitty.fetchAttrsChain = jest.fn().mockResolvedValueOnce({
      isGestating: false,
      isReady: true,
      cooldownIndex: 0,
      nextActionAt: 0,
      siringWithId: 0,
      birthTime: 1511111111,
      matronId: 1,
      sireId: 2,
      generation: 3,
      genes: 123456789,
    })

    Kitty.fetchAttrsApi = jest.fn().mockResolvedValueOnce({
      id: 123,
      name: 'Cheshire',
      owner: {
        address: '0x111',
      },
    })

    Kitty.createKitty = jest.fn().mockResolvedValue(4)

    const kittyId = await Kitty.importKitty(1, '0x111')
    expect(kittyId).toBe(4)
    expect(Kitty.createKitty).toHaveBeenCalledTimes(1)
    expect(Kitty.createKitty).toHaveBeenCalledWith(
      1, // matron ID
      2, // sire ID
      3, // generation
      123456789, // genes
      '0x111', // owner
      {
        id: 123,
        name: 'Cheshire',
        owner: {
          address: '0x111',
        },
      },
    )
  })
})
