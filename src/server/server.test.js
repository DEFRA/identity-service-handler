import { afterEach, describe, expect, test, vi } from 'vitest'
import { statusCodes } from './common/constants/status-codes.js'

vi.mock('./services/oidc/build-broker-provider.js')

import { buildBrokerProvider } from './services/oidc/build-broker-provider.js'
import { createServer } from './server.js'

describe('createServer', () => {
  let server
  afterEach(async () => {
    if (server) {
      await server.stop({ timeout: 0 })
    }
    vi.resetAllMocks()
  })

  test('it creates and configures a healthy hapi server', async () => {
    // Arrange
    vi.mocked(buildBrokerProvider).mockReturnValue({
      callback: vi.fn().mockReturnValue(vi.fn())
    })

    // Act
    server = await createServer()
    await server.initialize()
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/health'
    })

    // Assert
    expect(statusCode).toBe(statusCodes.ok)
  })
})
