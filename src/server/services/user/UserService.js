import * as service from './service.js'
import * as fakeService from './service.fake.js'
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
    this._impl = this.helperConfig.useFakeClient ? fakeService : service
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
   * @param {string} userId
   * @param {{ page?: number, pageSize?: number }} [options]
   * @returns {Promise<import('./service.js').DelegatedUsersPage>}
   */
  async getUserDelegates(userId, options = {}) {
    return this._impl.getUserDelegates(userId, options)
  }

  /**
   * Returns CPH delegations granted to a given user (the delegate) by a specific
   * delegating user (the CPH owner). Powers the manage page.
   *
   * @param {string} userId - the delegated user's ID
   * @param {string} delegatingUserId - the currently signed-in CPH owner
   * @param {{ page?: number, pageSize?: number }} [options]
   * @returns {Promise<import('./service.js').DelegatedUsersPage>}
   */
  async getUserDelegatedCphsByDelegatingUser(
    userId,
    delegatingUserId,
    options = {}
  ) {
    return this._impl.getUserDelegatedCphsByDelegatingUser(
      userId,
      delegatingUserId,
      options
    )
  }

  async getDelegatedUser(delegatingUserId, delegatedUserId) {
    const [delegatedUserDetails, delegatingUserCphs, delegatedUserCphs] =
      await Promise.all([
        this._impl.getUserDetails(delegatedUserId),
        this._impl.getUserCphs(delegatingUserId),
        this._impl.getUserCphs(delegatedUserId)
      ])
    const delegatedCphs = new Map(
      delegatedUserCphs.delegations.reduce((acc, cph) => {
        if (cph.delegating_user_id === delegatingUserId && !cph.revoked_at) {
          acc.push([cph.county_parish_holding_id, cph])
        }
        return acc
      }, [])
    )

    if (!delegatedCphs.size) {
      return null
    }

    return {
      id: delegatedUserId,
      email: delegatedUserDetails.email,
      cphs: delegatingUserCphs.assignments.map((cph) => ({
        county_parish_holding_id: cph.county_parish_holding_id,
        county_parish_holding_number: cph.county_parish_holding_number,
        delegation_id:
          delegatedCphs.get(cph.county_parish_holding_id)?.id || null
      }))
    }
  }

  /**
   * Fetches the users CPH assignments for a given user identifier.
   *
   * @param {string} userId
   * @returns {Promise<import('./service.js').UserCphAssignments>}
   */
  async getUserCphs(userId) {
    return this._impl.getUserCphs(userId)
  }

  /**
   * @param {string} sub
   * @returns {Promise<UserContext>}
   */
  async #fetchContext(sub) {
    const [userResult, cphResult] = await Promise.all([
      this._impl.getUserDetails(sub),
      this.getUserCphs(sub)
    ])

    const context = {
      sub,
      email: userResult.email,
      given_name: userResult.first_name,
      family_name: userResult.last_name,
      display_name: userResult.display_name,
      primary_cph: cphResult.assignments.map((a) => ({
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
