/**
 * @typedef {import('./service.js').Application} Application
 */

import { seconds } from '../../common/helpers/duration.js'

export class ApplicationCache {
  constructor(
    redis,
    applicationClient,
    { ttlSeconds = seconds.fiveMinutes } = {}
  ) {
    this.redis = redis
    this.applicationClient = applicationClient
    this.ttlSeconds = ttlSeconds
    this.prefix = 'application-cache'
  }

  key(clientId) {
    return `${this.prefix}:${clientId}`
  }

  /**
   * @param {string} clientId
   * @returns {Promise<Application | null>}
   */
  async get(clientId) {
    const cached = await this.redis.get(this.key(clientId))
    if (cached) {
      return JSON.parse(cached)
    }

    const application = await this.applicationClient.get(clientId)
    if (!application) {
      return null
    }

    await this.redis.set(
      this.key(clientId),
      JSON.stringify(application),
      'EX',
      this.ttlSeconds
    )
    return application
  }

  async invalidate(clientId) {
    await this.redis.del(this.key(clientId))
  }
}
