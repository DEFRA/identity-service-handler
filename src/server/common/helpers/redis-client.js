import { Cluster, Redis } from 'ioredis'
import { logger } from './logging/logger.js'

const port = 6379
const db = 0

/**
 * Setup Redis and provide a redis client
 *
 * Local development - 1 Redis instance
 * Environments - Elasticache / Redis Cluster with username and password
 */
export function buildRedisClient({
  keyPrefix,
  host,
  username,
  password,
  useTLS,
  useSingleInstanceCache
}) {
  const credentials = username === '' ? {} : { username, password }
  const tls = useTLS ? { tls: {} } : {}
  let redisClient

  if (useSingleInstanceCache) {
    redisClient = new Redis({
      port,
      host,
      db,
      keyPrefix,
      ...credentials,
      ...tls
    })
  } else {
    redisClient = new Cluster(
      [
        {
          host,
          port
        }
      ],
      {
        keyPrefix,
        slotsRefreshTimeout: 10000,
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: {
          db,
          ...credentials,
          ...tls
        }
      }
    )
  }

  redisClient.on('connect', () => {
    logger.info('Connected to Redis server')
  })

  redisClient.on('error', (error) => {
    logger.error(
      `Redis connection error ${error}\nErrors:\n${error.errors}\nStack:\n${error.stack}`
    )
  })

  return redisClient
}
