/**
 * @typedef {import('ioredis').Redis | import('ioredis').Cluster} RedisClient
 */

/**
 * @typedef {object} SubjectMapping
 * @property {string} sub
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
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
   * @param {string} sub
   * @returns {string}
   */
  #key(sub) {
    return `${this.#prefix}:${sub}`
  }

  /**
   * @param {string} sub
   * @returns {Promise<SubjectMapping | null>}
   */
  async get(sub) {
    const key = this.#key(sub)
    const raw = await this.redis.get(key)
    if (raw) {
      return JSON.parse(raw)
    }
    return null
  }

  /**
   * @param {SubjectMapping} subjectMapping
   * @returns {Promise<SubjectMapping>}
   */
  async create(subjectMapping) {
    const key = this.#key(subjectMapping.sub)
    await this.redis.set(key, JSON.stringify(subjectMapping))
    return subjectMapping
  }

  /**
   * @param {SubjectMapping} subjectMapping
   * @returns {Promise<SubjectMapping>}
   */
  async getOrCreateBrokerSub({ sub, email, firstName, lastName }) {
    const existing = await this.get(sub)
    if (existing) {
      return existing
    } else {
      return this.create({ sub, email, firstName, lastName })
    }
  }
}
