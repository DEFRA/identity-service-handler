import * as service from './service.js'
import * as serviceFake from './service.fake.js'
import { seconds } from '../../common/helpers/duration.js'

/**
 * @typedef {import('ioredis').Redis | import('ioredis').Cluster} RedisClient
 */

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */

/**
 * @typedef {object} UserContext
 * @property {string} sub
 * @property {string} email
 * @property {string} display_name
 * @property {string} given_name
 * @property {string} family_name
 * @property {UserCph[]} primary_cph
 * @property {UserCph[]} delegated_cph
 */

export class UserService {
  #contextCacheKeyPrefix = 'user_context'
  /**
   * @param {RedisClient} redis
   * @param {AppConfig} config
   */
  constructor(redis, config) {
    this.redis = redis
    this.helperConfig = config.get('idService.helper')
    this._impl = this.helperConfig.useFakeClient ? serviceFake : service
  }

  async #getCachedContext(sub) {
    const raw = await this.redis.get(`${this.#contextCacheKeyPrefix}:${sub}`)
    if (raw) {
      return JSON.parse(raw)
    }
    return null
  }

  async #setCachedContext(userContext) {
    await this.redis.set(
      `${this.#contextCacheKeyPrefix}:${userContext.sub}`,
      JSON.stringify(userContext),
      'EX',
      seconds.fiveMinutes
    )
  }

  /**
   * @param {sub} string
   * @returns {Promise<UserContext>}
   */
  async getUserContext(sub) {
    const cached = await this.#getCachedContext(sub)
    if (cached) {
      return cached
    }

    const userResult = await this._impl.getUserDetails(sub)
    const cphResult = await this._impl.getUserCphs(sub)

    const userContext = {
      sub,
      ...userResult,
      ...cphResult
    }

    await this.#setCachedContext(userContext)

    return userContext
  }
}
