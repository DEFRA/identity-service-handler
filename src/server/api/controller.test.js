import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#apiController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('No auth provided should redirect to your-defra-account', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/delegated-list/AG-DEL-11'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers['location']).toBe('/your-defra-account')
  })
})
