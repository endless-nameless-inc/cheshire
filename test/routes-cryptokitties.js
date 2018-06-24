const request = require('supertest')

const Api = require('../api')
const Kitty = require('../lib/kitty.js')
const User = require('../lib/user.js')

describe('routes-cryptokitties', () => {
  const api = Api.listen(0)

  afterAll(() => {
    api.close()
  })

  it('GET /kitties/:id should return kitty API object', async () => {
    Kitty.findById = jest.fn().mockResolvedValue({ api_object: '{"name": "cheshire"}' })

    await request(api)
      .get('/kitties/234')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          name: 'cheshire',
        })

        expect(Kitty.findById).toHaveBeenCalledTimes(1)
        expect(Kitty.findById).toHaveBeenCalledWith(234)
      })
  })

  it('GET /kitties/:id should return 404 status code for missing kitties', async () => {
    Kitty.findById = jest.fn().mockResolvedValue(undefined)

    await request(api)
      .get('/kitties/234')
      .expect('Content-Type', /plain/)
      .expect(404)
      .then((response) => {
        expect(response.text).toBe('Not Found')

        expect(Kitty.findById).toHaveBeenCalledTimes(1)
        expect(Kitty.findById).toHaveBeenCalledWith(234)
      })
  })

  it('GET /kitties should return kitties associated with owner_wallet_address', async () => {
    Kitty.findAll = jest.fn().mockResolvedValue([
      { api_object: '{"name": "cheshire"}' },
      { api_object: '{"name": "snowball"}' },
    ])
    Kitty.count = jest.fn().mockReturnValue(2)

    await request(api)
      .get('/kitties?owner_wallet_address=0x123&limit=5&offset=0')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          kitties: [
            { name: 'cheshire' },
            { name: 'snowball' },
          ],
          limit: 5,
          offset: 0,
          total: 2,
        })

        expect(Kitty.findAll).toHaveBeenCalledTimes(1)
        expect(Kitty.findAll).toHaveBeenCalledWith('0x123', 5, 0)
        expect(Kitty.count).toHaveBeenCalledTimes(1)
      })
  })

  it('GET /kitties should use default limit and offset', async () => {
    Kitty.findAll = jest.fn().mockResolvedValue([
      { api_object: '{"name": "cheshire"}' },
      { api_object: '{"name": "snowball"}' },
    ])
    Kitty.count = jest.fn().mockReturnValue(2)

    await request(api)
      .get('/kitties?owner_wallet_address=0x123')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          kitties: [
            { name: 'cheshire' },
            { name: 'snowball' },
          ],
          limit: 12,
          offset: 0,
          total: 2,
        })

        expect(Kitty.findAll).toHaveBeenCalledTimes(1)
        expect(Kitty.findAll).toHaveBeenCalledWith('0x123', 12, 0)
        expect(Kitty.count).toHaveBeenCalledTimes(1)
      })
  })

  it('GET /user/:address should return user API object', async () => {
    User.findByAddress = jest.fn().mockResolvedValue({
      address: '0x123ABC',
      api_object: '{"address": "0x123abc", "nickname":"Eugene", "image": "19"}',
    })

    await request(api)
      .get('/user/0x123ABC')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          address: '0x123abc',
          nickname: 'Eugene',
          image: '19',
        })

        expect(User.findByAddress).toHaveBeenCalledTimes(1)
        expect(User.findByAddress).toHaveBeenCalledWith('0x123ABC')
      })
  })

  it('GET /user/:id should return 404 status code for missing users', async () => {
    User.findByAddress = jest.fn().mockResolvedValue(undefined)

    await request(api)
      .get('/user/0x234')
      .expect('Content-Type', /json/)
      .expect(404)
      .then((response) => {
        expect(JSON.parse(response.text)).toEqual({
          error: 'user not found',
        })

        expect(User.findByAddress).toHaveBeenCalledTimes(1)
        expect(User.findByAddress).toHaveBeenCalledWith('0x234')
      })
  })
})
