import { createHash } from 'node:crypto'
/**
 * Replace with DB table subject_map.
 * Stable mapping: upstream (iss,sub) -> brokerSub
 */

/**
 * @typedef {import('ioredis').Redis | import('ioredis').Cluster} RedisClient
 */

/**
 * @typedef {object} SubjectMapping
 * @property {string} sub
 * @property {string} email
 */

export class SubjectsService {
  #prefix = 'subject-map'
  /**
   * @param {RedisClient} redis
   */
  constructor(redis) {
    this.redis = redis
  }
  /**
   * @param {string} brokerSub
   * @returns {string}
   */
  #key(brokerSub) {
    return `${this.#prefix}:${brokerSub}`
  }

  /**
   * @param {string} iss
   * @param {string} upstreamSub
   * @param {string} email
   * @returns {string}
   */
  static generateBrokerSub(iss, upstreamSub, email) {
    return createHash('sha256')
      .update(`${iss}|${upstreamSub}|${email}`)
      .digest('hex')
  }

  /**
   * @param {string} brokerSub
   * @returns {Promise<SubjectMapping | undefined>}
   */
  async get(brokerSub) {
    const key = this.#key(brokerSub)
    const raw = await this.redis.get(key)
    if (raw) {
      return JSON.parse(raw)
    }
  }

  /**
   * @param {string} brokerSub
   * @param {string} email
   * @returns {Promise<SubjectMapping>}
   */
  async create(brokerSub, email) {
    const key = this.#key(brokerSub)
    const value = {
      sub: brokerSub,
      email
    }
    await this.redis.set(key, JSON.stringify(value))
    return value
  }

  /**
   * @param {string} iss
   * @param {string} upstreamSub
   * @param {string} email
   * @returns {Promise<SubjectMapping>}
   */
  async getOrCreateBrokerSub(iss, upstreamSub, email) {
    const brokerSub = SubjectsService.generateBrokerSub(iss, upstreamSub, email)
    const existing = await this.get(brokerSub)
    if (existing) {
      return existing
    } else {
      return this.create(brokerSub, email)
    }
  }
}
