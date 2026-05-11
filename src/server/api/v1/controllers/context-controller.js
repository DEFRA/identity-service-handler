import userService from '../../../services/user/index.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { seconds } from '../../../common/helpers/duration.js'
import { getUserContext } from '../../../common/helpers/user-context.js'

const CONTEXT_CACHE_KEY_PREFIX = 'user_context'

export const contextController = (redis) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const cacheKey = `${CONTEXT_CACHE_KEY_PREFIX}:${sub}`

    const cached = await redis.get(cacheKey)
    if (cached) {
      return h.response(JSON.parse(cached)).code(statusCodes.ok)
    }
    const profile = await userService.getUserProfile(sub)
    const context = getUserContext(profile)
    await redis.set(
      cacheKey,
      JSON.stringify(context),
      'EX',
      seconds.fiveMinutes
    )
    return h.response(context).code(statusCodes.ok)
  }
})
