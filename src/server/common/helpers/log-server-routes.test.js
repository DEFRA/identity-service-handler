import { describe, test, expect, vi, afterEach } from 'vitest'
import * as oidcConfig from './oidc-config.js'
import { logServerRoutes } from './start-server.js'

vi.mock('./oidc-config.js')

const mocks = {
  getFormatedOidcRoutes: vi.mocked(oidcConfig.getFormatedOidcRoutes),
  loggerInfo: vi.fn()
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('logServerRoutes()', () => {
  test('it logs oidc and server routes sorted alphabetically', async () => {
    // Arrange
    mocks.getFormatedOidcRoutes.mockReturnValue([
      'GET     /authorize',
      'GET     /jwks'
    ])
    const server = {
      table: vi.fn().mockReturnValue([
        { method: 'get', path: '/health', settings: {} },
        { method: 'post', path: '/auth', settings: {} }
      ]),
      logger: { info: mocks.loggerInfo }
    }

    // Act
    await logServerRoutes(server)

    // Assert
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      '\nSupported routes:\n' +
        'GET     /authorize\n' +
        'GET     /health\n' +
        'GET     /jwks\n' +
        'POST    /auth'
    )
  })
})
