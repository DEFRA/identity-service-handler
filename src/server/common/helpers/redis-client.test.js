import { afterEach, describe, expect, test, vi } from 'vitest'
import { Cluster, Redis } from 'ioredis'
import { buildRedisClient } from './redis-client.js'

vi.mock('ioredis', () => ({
  Redis: vi.fn(),
  Cluster: vi.fn()
}))

Redis.prototype.on = vi.fn()
Cluster.prototype.on = vi.fn()

describe('buildRedisClient', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('When Redis Single InstanceCache is requested', () => {
    test('it instantiates Redis with the correct config and registers event handlers', () => {
      // Arrange
      const config = {
        host: 'localhost',
        keyPrefix: 'test:',
        useSingleInstanceCache: true,
        useTLS: false,
        username: '',
        password: ''
      }

      // Act
      const client = buildRedisClient(config)

      // Assert
      expect(client).toBeInstanceOf(Redis)
      expect(Redis).toHaveBeenCalledWith({
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
    test('it instantiates Cluster with the correct config and registers event handlers', () => {
      // Arrange
      const config = {
        host: 'localhost',
        keyPrefix: 'test:',
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      }

      // Act
      const client = buildRedisClient(config)

      // Assert
      expect(client).toBeInstanceOf(Cluster)
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: 'localhost', port: 6379 }],
        {
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
