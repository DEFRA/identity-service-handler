/**
 * Minimal Redis adapter for oidc-provider using ioredis.
 * Good MVP base; production: add metrics, structured errors, prefixes per env, etc.
 */
export class RedisAdapter {
  constructor(model, redis, prefix = 'oidc') {
    this.model = model
    this.redis = redis
    this.prefix = prefix
  }

  key(id) {
    const m = this.model.toLowerCase()
    return `${this.prefix}:${m}:${id}`
  }

  grantIndexKey(grantId) {
    return `${this.prefix}:grant_idx:${grantId}`
  }

  // Historical bug compatibility: older code used this key for both
  // Grant entity payload and grant index set, causing WRONGTYPE failures.
  legacyGrantIndexKey(grantId) {
    return `${this.prefix}:grant:${grantId}`
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id)
    const value = JSON.stringify(payload)

    // Self-heal legacy type corruption: model records must be stored as strings.
    const existingType = await this.redis.type(key)
    if (existingType !== 'none' && existingType !== 'string') {
      await this.redis.del(key)
    }

    if (expiresIn) {
      await this.redis.set(key, value, 'EX', expiresIn)
    } else {
      await this.redis.set(key, value)
    }

    // Allow revokeByGrantId
    if (payload.grantId) {
      const gk = this.grantIndexKey(payload.grantId)
      const idxType = await this.redis.type(gk)
      if (idxType !== 'none' && idxType !== 'set') {
        await this.redis.del(gk)
      }
      await this.redis.sadd(gk, key)
      if (expiresIn) await this.redis.expire(gk, expiresIn)
    }
  }

  async find(id) {
    const key = this.key(id)
    const type = await this.redis.type(key)
    if (type === 'none') return undefined
    if (type !== 'string') {
      // Self-heal corrupted key; caller can recreate entity if required.
      await this.redis.del(key)
      return undefined
    }

    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : undefined
  }

  async findByUid(uid) {
    // Scan for session keys matching the pattern
    const pattern = this.key('*')
    const keys = []
    let cursor = '0'

    do {
      const result = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')

    // Check each key for matching uid
    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        const payload = JSON.parse(data)
        if (payload.uid === uid) {
          return payload
        }
      }
    }

    return undefined
  }

  async destroy(id) {
    await this.redis.del(this.key(id))
  }

  async revokeByGrantId(grantId) {
    const gk = this.grantIndexKey(grantId)
    const gkType = await this.redis.type(gk)
    if (gkType === 'set') {
      const keys = await this.redis.smembers(gk)
      if (keys.length) await this.redis.del(keys)
      await this.redis.del(gk)
    } else if (gkType !== 'none') {
      await this.redis.del(gk)
    }

    // Clean up legacy/corrupted grant index key if present as a set.
    const legacyKey = this.legacyGrantIndexKey(grantId)
    const legacyType = await this.redis.type(legacyKey)
    if (legacyType === 'set') {
      const legacyKeys = await this.redis.smembers(legacyKey)
      if (legacyKeys.length) await this.redis.del(legacyKeys)
      await this.redis.del(legacyKey)
    }
  }

  async consume(id) {
    const key = this.key(id)
    const type = await this.redis.type(key)
    if (type !== 'string') return

    const data = await this.redis.get(key)
    if (!data) return

    const payload = JSON.parse(data)
    payload.consumed = Math.floor(Date.now() / 1000)
    await this.redis.set(key, JSON.stringify(payload))
  }
}
