import { describe, expect, test, vi, afterEach } from 'vitest'
import * as jose from 'jose'
import { config } from '../../../../config/config.js'
import { auth } from './auth.js'
import { validateSession } from './validate-session.js'
import { authenticateBearer } from './authenticate-bearer.js'
import { onCredentials } from './on-credentials.js'

vi.mock('jose')
vi.mock('./validate-session.js')
vi.mock('./authenticate-bearer.js')
vi.mock('./on-credentials.js')

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  createRemoteJWKSet: vi.mocked(jose.createRemoteJWKSet)
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('auth plugin', () => {
  test('it registers session and bearer strategies and onCredentials extension', async () => {
    // Arrange
    mocks.configGet.mockReturnValue('https://test.example.com')
    const strategy = vi.fn()
    const scheme = vi.fn()
    const ext = vi.fn()
    const server = { auth: { strategy, scheme }, ext }
    const brokerProvider = {}

    // Act
    await auth.plugin.register(server, { brokerProvider })

    // Assert
    expect(strategy).toHaveBeenCalledWith(
      'session',
      'cookie',
      expect.objectContaining({ validate: validateSession })
    )
    expect(scheme).toHaveBeenCalledWith('bearer', expect.any(Function))
    expect(strategy).toHaveBeenCalledWith('bearer', 'bearer')
    expect(ext).toHaveBeenCalledWith('onCredentials', onCredentials)
  })

  test('it wires authenticateBearer into the bearer scheme authenticate function', async () => {
    // Arrange
    mocks.configGet.mockReturnValue('https://test.example.com')
    mocks.createRemoteJWKSet.mockReturnValue({})
    const strategy = vi.fn()
    const scheme = vi.fn()
    const ext = vi.fn()
    const server = { auth: { strategy, scheme }, ext }
    const brokerProvider = {}

    // Act
    await auth.plugin.register(server, { brokerProvider })

    // Assert
    const schemeFactory = scheme.mock.calls.find(
      ([name]) => name === 'bearer'
    )[1]
    const { authenticate } = schemeFactory()
    const req = {}
    const h = {}
    await authenticate(req, h)
    expect(authenticateBearer).toHaveBeenCalledWith(
      req,
      h,
      expect.anything(),
      brokerProvider
    )
  })
})
