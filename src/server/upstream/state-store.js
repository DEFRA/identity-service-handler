export class UpstreamStateStore {
  constructor(redis) {
    this.redis = redis
    this.prefix = 'upstream'
  }

  key(state) {
    return `${this.prefix}:state:${state}`
  }

  uidKey(uid) {
    return `${this.prefix}:uid:${uid}`
  }

  async put(state, record, ttlSeconds = 600) {
    await this.redis.set(
      this.key(state),
      JSON.stringify(record),
      'EX',
      ttlSeconds
    )
  }

  async get(state) {
    const raw = await this.redis.get(this.key(state))
    return raw ? JSON.parse(raw) : null
  }

  async del(state) {
    await this.redis.del(this.key(state))
  }

  async putByUid(uid, record, ttlSeconds = 600) {
    await this.redis.set(
      this.uidKey(uid),
      JSON.stringify(record),
      'EX',
      ttlSeconds
    )
  }

  async getByUid(uid) {
    const raw = await this.redis.get(this.uidKey(uid))
    return raw ? JSON.parse(raw) : null
  }

  async delByUid(uid) {
    await this.redis.del(this.uidKey(uid))
  }
}
