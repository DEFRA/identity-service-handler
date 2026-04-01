import { describe, test, expect, vi, afterEach } from 'vitest'
import { OIDC_ROUTES } from './oidc-config.js'
import { logServerRoutes } from './start-server.js'

const mocks = {
  loggerInfo: vi.fn()
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('logServerRoutes()', () => {
  test('it logs oidc and server routes sorted alphabetically', async () => {
    // Arrange
    const server = {
      table: vi.fn().mockReturnValue([
        { method: 'get', path: '/health', settings: {} },
        { method: 'post', path: '/auth', settings: {} }
      ]),
      logger: { info: mocks.loggerInfo }
    }
    const expectedRoutes = [
      ...OIDC_ROUTES.map((r) => `${'GET'.padEnd(7)} ${r}`),
      'GET     /health',
      'POST    /auth'
    ]
      .sort()
      .join('\n')

    // Act
    await logServerRoutes(server)

    // Assert
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      '\nSupported routes:\n' + expectedRoutes
    )
  })
})
