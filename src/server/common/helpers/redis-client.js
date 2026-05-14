import { Cluster, Redis } from 'ioredis'
import { config } from '../../../config/config.js'
import { logger } from './logging/logger.js'

const port = 6379
const db = 0

const { keyPrefix, host, username, password, useTLS, useSingleInstanceCache } =
  config.get('redis')

const credentials = username === '' ? {} : { username, password }
const tls = useTLS ? { tls: {} } : {}

export const redisClient = useSingleInstanceCache
  ? new Redis({
      lazyConnect: true,
      port,
      host,
      db,
      keyPrefix,
      ...credentials,
      ...tls
    })
  : new Cluster(
      [
        {
          host,
          port
        }
      ],
      {
        lazyConnect: true,
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

redisClient.on('connect', () => {
  logger.info('Connected to Redis server')
})

redisClient.on('error', (error) => {
  logger.error(
    `Redis connection error ${error}\nErrors:\n${error.errors}\nStack:\n${error.stack}`
  )
})
