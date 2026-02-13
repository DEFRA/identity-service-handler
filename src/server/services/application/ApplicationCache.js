export class ApplicationCache {
  constructor(redis, applicationClient, { ttlSeconds = 300 } = {}) {
    this.redis = redis
    this.applicationClient = applicationClient
    this.ttlSeconds = ttlSeconds
    this.prefix = 'application-cache'
  }

  key(clientId) {
    return `${this.prefix}:${clientId}`
  }

  async getClient(clientId, requestCtx) {
    const cached = await this.redis.get(this.key(clientId))
    if (cached) return JSON.parse(cached)

    const client = await this.applicationClient.get(requestCtx, clientId)
    if (!client) return null

    await this.redis.set(
      this.key(clientId),
      JSON.stringify(client),
      'EX',
      this.ttlSeconds
    )
    return client
  }

  async invalidate(clientId) {
    await this.redis.del(this.key(clientId))
  }
}
