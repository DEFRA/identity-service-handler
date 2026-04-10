import { describe, test, expect, vi, afterEach } from 'vitest'
import { OIDC_ROUTES } from './oidc-config.js'
import { logServerRoutes } from './log-server-routes.js'

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
      { method: 'get', path: '/health' },
      { method: 'post', path: '/auth' },
      ...OIDC_ROUTES.map((path) => ({ method: 'GET', path }))
    ]
      .map((r) => '\n' + r.method.toUpperCase().padEnd(8) + r.path)
      .sort((a, b) => a.localeCompare(b))

    // Act
    logServerRoutes(server)

    // Assert
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      `\nSupported routes:` + expectedRoutes
    )
  })
})
