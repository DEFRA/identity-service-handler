import { vi } from 'vitest'

import { Cluster, Redis } from 'ioredis'

import { config } from '../../../config/config.js'
import { buildRedisClient } from './redis-client.js'

vi.mock('ioredis', () => ({
  ...vi.importActual('ioredis'),
  Cluster: vi.fn(function MockCluster() {
    return { on: () => ({}) }
  }),
  Redis: vi.fn(function MockRedis() {
    return { on: () => ({}) }
  })
}))

describe('#buildRedisClient', () => {
  describe('When Redis Single InstanceCache is requested', () => {
    beforeEach(() => {
      buildRedisClient(config.get('redis'))
    })

    test('Should instantiate a single Redis client', () => {
      const redisHost = config.get('redis.host')

      expect(Redis).toHaveBeenCalledWith({
        db: 0,
        host: redisHost,
        keyPrefix: 'identity-service-handler:',
        port: 6379
      })
    })
  })

  describe('When a Redis Cluster is requested', () => {
    beforeEach(() => {
      buildRedisClient({
        ...config.get('redis'),
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })
    })

    test('Should instantiate a Redis Cluster client', () => {
      const redisHost = config.get('redis.host')

      expect(Cluster).toHaveBeenCalledWith([{ host: redisHost, port: 6379 }], {
        dnsLookup: expect.any(Function),
        keyPrefix: 'identity-service-handler:',
        redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
        slotsRefreshTimeout: 10000
      })
    })
  })
})
