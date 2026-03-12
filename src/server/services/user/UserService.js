import * as service from './service.js'
import * as serviceFake from './service.fake.js'

const UserContextKey = 'userContext'

/**
 * @typedef {import('ioredis').Redis | import('ioredis').Cluster} RedisClient
 */

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */

/**
 * @typedef {import('../subjects.js').SubjectMapping} SubjectMapping
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
   * @param {string} prefix
   * @param {string} id
   * @returns {string}
   */
  key(prefix, id) {
    return `${prefix}:${id}`
  }

  /**
   * @param {SubjectMapping} subjectMapping
   * @returns {Promise<UserContext | undefined>}
   */
  async getUserContext(subjectMapping) {
    const raw = await this.redis.get(
      this.key(UserContextKey, subjectMapping.sub)
    )
    if (raw) return JSON.parse(raw)

    const userResult = await this._impl.getUserDetails(subjectMapping.sub)
    const cphResult = await this._impl.getUserCphs(subjectMapping.sub)

    const userContext = {
      ...subjectMapping,
      ...userResult,
      ...cphResult
    }

    await this.redis.set(
      this.key(UserContextKey, subjectMapping.sub),
      JSON.stringify(userContext),
      'EX',
      300
    )

    return userContext
  }
}
