const request = require('supertest')

const Api = require('../api')
const Contract = require('../lib/contract.js')
const Kitty = require('../lib/kitty.js')
const User = require('../lib/user.js')

describe('routes-cheshire', () => {
  const api = Api.listen(0)

  afterAll(() => {
    api.close()
  })

  it('GET / should serve dashboard', async () => {
    await request(api)
      .get('/')
      .expect('Content-Type', /text/)
      .expect(200)
      .then((response) => {
        expect(response.text).toContain('<title>Cheshire Dashboard</title>')
      })
  })

  it('GET /cheshire/contracts should return contract addresses', async () => {
    process.env.ADDRESS_KITTY_CORE = '0x111'
    process.env.ADDRESS_SALE_CLOCK_AUCTION = '0x222'
    process.env.ADDRESS_SIRING_CLOCK_AUCTION = '0x333'

    await request(api)
      .get('/cheshire/contracts')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          KittyCore: '0x111',
          SaleClockAuction: '0x222',
          SiringClockAuction: '0x333',
        })
      })
  })

  it('POST /cheshire/contracts should deploy contract', async () => {
    Contract.deploy = jest.fn().mockReturnValue({ address: '0x111' })

    await request(api)
      .post('/cheshire/contracts')
      .send({ contractName: 'KittyRace', constructorArgs: [] })
      .set('Accept', 'application/json')
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          address: '0x111',
        })

        expect(Contract.deploy).toHaveBeenCalledTimes(1)
        expect(Contract.deploy).toHaveBeenCalledWith('KittyRace')
      })
  })

  it('POST /cheshire/kitties should create kitty', async () => {
    Kitty.createKitty = jest.fn().mockReturnValue(23)

    await request(api)
      .post('/cheshire/kitties')
      .send({
        matronId: 1,
        sireId: 2,
        generation: 3,
        genes: 4,
        owner: '0x123',
        apiObject: { name: 'cheshire' },
      })
      .set('Accept', 'application/json')
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          kittyId: 23,
        })

        expect(Kitty.createKitty).toHaveBeenCalledTimes(1)
        expect(Kitty.createKitty).toHaveBeenCalledWith(
          1, // matron ID
          2, // sire Id
          3, // generation
          4, // genes
          '0x123', // owner
          { name: 'cheshire' }, // apiObject
        )
      })
  })

  it('POST /cheshire/kitties/import should import kitty', async () => {
    Kitty.importKitty = jest.fn().mockReturnValue(111)

    await request(api)
      .post('/cheshire/kitties/import')
      .send({ kittyIdMainnet: 1, ownerTestnet: '0x222' })
      .set('Accept', 'application/json')
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          kittyId: 111,
        })

        expect(Kitty.importKitty).toHaveBeenCalledTimes(1)
        expect(Kitty.importKitty).toHaveBeenCalledWith(1, '0x222')
      })
  })

  it('POST /cheshire/users should import user', async () => {
    User.importUser = jest.fn().mockReturnValue('0x111abc')

    await request(api)
      .post('/cheshire/users')
      .send({ addressMainnet: '0x111ABC', addressTestnet: '0x222DEF' })
      .set('Accept', 'application/json')
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          address: '0x222DEF',
        })

        expect(User.importUser).toHaveBeenCalledTimes(1)
        expect(User.importUser).toHaveBeenCalledWith('0x111ABC', '0x222DEF')
      })
  })

  it('GET /cheshire/users should return users list', async () => {
    User.findAll = jest.fn().mockReturnValue([{ api_object: '{ "name": "eugene" }' }])

    await request(api)
      .get('/cheshire/users')
      .set('Accept', 'application/json')
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          users: [
            { name: 'eugene' },
          ],
        })

        expect(User.findAll).toHaveBeenCalledTimes(1)
      })
  })
})
