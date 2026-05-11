import applicationService from '../application/index.js'
import { buildClientParams } from './build-client-params.js'
import { seconds } from '../../common/helpers/duration.js'

const APPLICATION_CACHE_KEY_PREFIX = 'application-cache'

/**
 * Finds an OIDC client by client ID, returning a new OidcClient instance if
 * found. Results are cached in Redis for five minutes.
 *
 * @param {string} clientId
 * @param {import('ioredis').Redis | import('ioredis').Cluster} redis
 * @param {new (params: object) => object} OidcClient
 * @returns {Promise<object | undefined>}
 */
export async function findClient(clientId, redis, OidcClient) {
  const cacheKey = `${APPLICATION_CACHE_KEY_PREFIX}:${clientId}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return new OidcClient(buildClientParams(JSON.parse(cached)))
  }

  const application = await applicationService.get(clientId)
  if (!application) {
    return undefined
  }

  await redis.set(
    cacheKey,
    JSON.stringify(application),
    'EX',
    seconds.fiveMinutes
  )
  return new OidcClient(buildClientParams(application))
}
