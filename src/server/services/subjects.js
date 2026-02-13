/**
 * Replace with DB table subject_map.
 * Stable mapping: upstream (iss,sub) -> brokerSub
 */
export class SubjectsService {
  constructor(redis) {
    this.redis = redis
    this.prefix = 'submap'
  }

  key(iss, sub) {
    return `${this.prefix}:${encodeURIComponent(iss)}:${sub}`
  }

  async getOrCreateBrokerSub(upstreamIss, upstreamSub) {
    const k = this.key(upstreamIss, upstreamSub)
    const existing = await this.redis.get(k)
    if (existing) return existing

    const brokerSub = upstreamSub
    await this.redis.set(k, brokerSub)
    return brokerSub
  }
}
