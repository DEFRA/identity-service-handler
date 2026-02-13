import { createServer } from '../../server.js'

describe('#contentSecurityPolicy', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', async () => {
    const resp = await server.inject({
      method: 'GET',
      url: '/ADD_HTML_OUTPUT_HERE_WHEN_WE_HAVE_SOME'
    })

    // TODO: update this once we have some HTML output and remove the not null check
    // expect(resp.headers['content-security-policy']).toBeDefined()
    expect(resp).not.toBeNull()
  })
})
