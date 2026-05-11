import { redisClient } from '../../common/helpers/redis-client.js'
import applicationService from '../application/index.js'
import { buildClientParams } from './build-client-params.js'
import { seconds } from '../../common/helpers/duration.js'

const APPLICATION_CACHE_KEY_PREFIX = 'application-cache'

export async function findClient(clientId, OidcClient) {
  const cacheKey = `${APPLICATION_CACHE_KEY_PREFIX}:${clientId}`

  const cached = await redisClient.get(cacheKey)
  if (cached) {
    return new OidcClient(buildClientParams(JSON.parse(cached)))
  }

  const application = await applicationService.get(clientId)
  if (!application) {
    return undefined
  }

  await redisClient.set(
    cacheKey,
    JSON.stringify(application),
    'EX',
    seconds.fiveMinutes
  )
  return new OidcClient(buildClientParams(application))
}
