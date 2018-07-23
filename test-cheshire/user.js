const axios = require('axios')

const User = require('../lib/user.js')
const Kitty = require('../lib/kitty.js')

describe('user', () => {
  beforeAll(() => {
    User.db.serialize(() => {
      User.db.run('INSERT INTO users (address_mainnet, address_testnet, api_object) VALUES (?, ?, ?)', '0x123', '0x456', JSON.stringify({ name: 'Eugene' }))
      User.db.run('INSERT INTO users (address_mainnet, address_testnet, api_object) VALUES (?, ?, ?)', '0x234', '0x345', JSON.stringify({ name: 'Charley' }))
    })
  })

  afterAll(() => {
    User.db.close()
  })

  it('count should return total number of users in database', async () => {
    const count = await User.count()
    expect(count).toBe(2)
  })

  it('could should handle database errors', async () => {
    jest
      .spyOn(User.db, 'get')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(User.count()).rejects.toEqual('DB Error!')
  })

  it('fetchAttrsApi should retrieve data from the production CryptoKitties API', async () => {
    axios.get = jest.fn().mockReturnValue({
      data: {
        address: '0x40d7c5fbc89c0ca3880d79e38e5099d786f4ab65',
        nickname: 'Eugene',
        image: '19',
      },
    })

    const attrs = await User.fetchAttrsApi('0x40D7c5fbc89c0ca3880d79e38e5099d786f4ab65')
    expect(attrs).toEqual({
      address: '0x40d7c5fbc89c0ca3880d79e38e5099d786f4ab65',
      nickname: 'Eugene',
      image: '19',
    })
    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith('https://api.cryptokitties.co/user/0x40D7c5fbc89c0ca3880d79e38e5099d786f4ab65')
  })

  it('findAll should return all users in database', async () => {
    const users = await User.findAll()
    expect(users.length).toBe(2)
  })

  it('findAll should handle database errors', async () => {
    jest
      .spyOn(User.db, 'all')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(User.findAll()).rejects.toEqual('DB Error!')
  })

  it('findByAddress should return user associated with given address', async () => {
    const user = await User.findByAddress('0x456')
    expect(user.api_object).toBeDefined()
  })

  it('findByAddress should handles database errors', async () => {
    jest
      .spyOn(User.db, 'get')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    expect(User.findByAddress('0x123')).rejects.toEqual('DB Error!')
  })

  it('findByAddress should return undefined when user with address is not found', async () => {
    const user = await User.findByAddress('0xabc')
    expect(user).toBeUndefined()
  })

  it('createUser should insert user into database', async () => {
    await User.createUser('0x111', '0x222', { name: 'jonno' })
    const user = await User.findByAddress('0x222')
    expect(JSON.parse(user.api_object).name).toBe('jonno')
  })

  it('createUser should handle database errors', async () => {
    jest
      .spyOn(User.db, 'run')
      .mockImplementation((...params) => {
        params[params.length - 1]('DB Error!') // callback('DB Error!')
      })

    await expect(User.createUser('0x111', '0x222', { name: 'jonno' })).rejects.toEqual('DB Error!')
  })

  it('importUser should create user with production API data', async () => {
    axios.get = jest.fn()
      .mockReturnValueOnce({ // /user/0x111
        data: {
          address: '0x111',
          nickname: 'Jonno',
          image: '19',
        },
      })
      .mockReturnValueOnce({ // /kitties?owner_wallet_address=0x111
        data: {
          kitties: [],
        },
      })

    Kitty.importKitty = jest.fn().mockResolvedValue(23)

    const addressTestnet = await User.importUser('0x111', '0x456')
    expect(addressTestnet).toBe('0x456')

    const user = await User.findByAddress(addressTestnet)
    expect(JSON.parse(user.api_object).nickname).toBe('Jonno')

    expect(Kitty.importKitty).toHaveBeenCalledTimes(0)
  })

  it('importUser should create user and kitties with production API data', async () => {
    axios.get = jest.fn()
      .mockReturnValueOnce({ // GET /user/0x111
        data: {
          address: '0x111',
          nickname: 'Jonno',
          image: '19',
        },
      })
      .mockReturnValueOnce({ // GET /kitties?owner_wallet_address=0x111
        data: {
          kitties: [
            {
              id: 123,
              name: 'Cheshire',
              owner: {
                address: '0x111',
              },
            },
          ],
        },
      })

    Kitty.importKitty = jest.fn().mockResolvedValue(23)

    const addressTestnet = await User.importUser('0x111', '0x456')
    expect(addressTestnet).toBe('0x456')

    const user = await User.findByAddress(addressTestnet)
    expect(JSON.parse(user.api_object).nickname).toBe('Jonno')
    expect(Kitty.importKitty).toHaveBeenCalledTimes(1)
    expect(Kitty.importKitty).toHaveBeenCalledWith(123, '0x456')
  })
})
