import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('ioredis', () => {
  const Redis = vi.fn()
  Redis.prototype.on = vi.fn()
  const Cluster = vi.fn()
  Cluster.prototype.on = vi.fn()
  return { Redis, Cluster }
})

vi.mock('../../../config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('./logging/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn() }
}))

describe('buildRedisClient', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  describe('When Redis Single InstanceCache is requested', () => {
    test('it instantiates Redis with the correct config and registers event handlers', async () => {
      // Arrange
      const { config } = await import('../../../config/config.js')
      config.get.mockReturnValue({
        host: 'localhost',
        keyPrefix: 'test:',
        useSingleInstanceCache: true,
        useTLS: false,
        username: '',
        password: ''
      })

      // Act
      const { redisClient } = await import('./redis-client.js')
      const { Redis } = await import('ioredis')

      // Assert
      expect(redisClient).toBeInstanceOf(Redis)
      expect(Redis).toHaveBeenCalledWith({
        lazyConnect: true,
        db: 0,
        host: 'localhost',
        keyPrefix: 'test:',
        port: 6379
      })
      expect(Redis.prototype.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function)
      )
      expect(Redis.prototype.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })
  })

  describe('When a Redis Cluster is requested', () => {
    test('it instantiates Cluster with the correct config and registers event handlers', async () => {
      // Arrange
      const { config } = await import('../../../config/config.js')
      config.get.mockReturnValue({
        host: 'localhost',
        keyPrefix: 'test:',
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })

      // Act
      const { redisClient } = await import('./redis-client.js')
      const { Cluster } = await import('ioredis')

      // Assert
      expect(redisClient).toBeInstanceOf(Cluster)
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: 'localhost', port: 6379 }],
        {
          lazyConnect: true,
          dnsLookup: expect.any(Function),
          keyPrefix: 'test:',
          redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
          slotsRefreshTimeout: 10000
        }
      )
      expect(Cluster.prototype.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function)
      )
      expect(Cluster.prototype.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })
  })
})
