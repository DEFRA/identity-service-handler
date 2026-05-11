import { afterEach, describe, expect, test, vi } from 'vitest'
import { statusCodes } from './common/constants/status-codes.js'
import { buildBrokerProvider } from './services/oidc/build-broker-provider.js'
import { createServer } from './server.js'
import { redisClient } from './common/helpers/redis-client.js'

vi.mock('./services/oidc/build-broker-provider.js')

const mocks = {
  buildBrokerProvider: vi.mocked(buildBrokerProvider),
  redisClientConnect: vi.spyOn(redisClient, 'connect')
}

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
    mocks.buildBrokerProvider.mockReturnValue({
      callback: vi.fn().mockReturnValue(vi.fn())
    })
    mocks.redisClientConnect.mockResolvedValue(null)

    // Act
    server = await createServer()
    await server.initialize()
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/health'
    })

    // Assert
    expect(statusCode).toBe(statusCodes.ok)
    expect(mocks.redisClientConnect).toHaveBeenCalled()
  })
})
