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
 * @typedef {object} UserCph
 * @property {string} cph
 * @property {string | null} [expires]
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
  /**
   * @param {string} sub
   * @returns {Promise<UserContext | null>}
   */
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
   * @param {string} sub
   * @returns {Promise<UserContext>}
   */
  async #fetchContext(sub) {
    const [userResult, cphResult] = await Promise.all([
      this._impl.getUserDetails(sub),
      this._impl.getUserCphs(sub)
    ])

    const context = {
      sub,
      email: userResult.email,
      given_name: userResult.first_name,
      family_name: userResult.last_name,
      display_name: userResult.display_name,
      primary_cph: cphResult.associations.map((a) => ({
        cph: a.county_parish_holding_number,
        expires: null
      })),
      delegated_cph: cphResult.delegations.map((d) => ({
        cph: d.county_parish_holding_number,
        expires: d.expires_at || null
      }))
    }

    await this.#setCachedContext(context)

    return context
  }

  /**
   * @param {string} sub
   * @returns {Promise<UserContext>}
   */
  async getUserContext(sub) {
    const now = Date.now()
    let context = await this.#getCachedContext(sub)
    if (!context) {
      context = await this.#fetchContext(sub)
    }

    return {
      ...context,
      delegated_cph: context.delegated_cph.filter(
        ({ expires }) => !expires || new Date(expires).getTime() > now
      )
    }
  }
}
