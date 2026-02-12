import { randomBytes, createHash } from 'crypto'

export class ClientsServiceRedis {
  constructor(redis) {
    this.redis = redis
    this.prefix = 'clients'
    this.cache = new Map() // clientId -> { value, expMs }
    this.cacheTtlMs = 30_000
  }

  key(clientId) {
    return `${this.prefix}:client:${clientId}`
  }

  indexKey() {
    return `${this.prefix}:index`
  }

  now() {
    return Date.now()
  }

  cacheGet(clientId) {
    const hit = this.cache.get(clientId)
    if (!hit) return null
    if (hit.expMs < this.now()) {
      this.cache.delete(clientId)
      return null
    }
    return hit.value
  }

  cacheSet(clientId, value) {
    this.cache.set(clientId, { value, expMs: this.now() + this.cacheTtlMs })
  }

  invalidate(clientId) {
    this.cache.delete(clientId)
  }

  static newClientId() {
    return `app-${randomBytes(9).toString('base64url')}`
  }

  static newClientSecret() {
    return randomBytes(48).toString('base64url')
  }

  static hashSecret(secret) {
    // MVP: SHA-256. Production: argon2id/bcrypt/scrypt.
    return createHash('sha256').update(secret).digest('hex')
  }

  validateClientRecord(client) {
    if (!client?.client_id) throw new Error('client_id required')

    if (
      !Array.isArray(client.redirect_uris) ||
      client.redirect_uris.length === 0
    ) {
      throw new Error('redirect_uris must be a non-empty array')
    }

    for (const u of client.redirect_uris) {
      try {
        new URL(u)
      } catch {
        throw new Error(`Invalid redirect_uri: ${u}`)
      }
    }

    if (client.post_logout_redirect_uris) {
      for (const u of client.post_logout_redirect_uris) {
        try {
          new URL(u)
        } catch {
          throw new Error(`Invalid post_logout_redirect_uri: ${u}`)
        }
      }
    }

    // OPTION A: private_key_jwt only
    if (client.token_endpoint_auth_method !== 'private_key_jwt') {
      throw new Error(
        'token_endpoint_auth_method must be private_key_jwt (client_secret_* not supported)'
      )
    }

    if (
      !client.jwks ||
      !Array.isArray(client.jwks.keys) ||
      client.jwks.keys.length === 0
    ) {
      throw new Error('jwks.keys must be provided for private_key_jwt')
    }
  }

  async upsertClient(client) {
    this.validateClientRecord(client)
    await this.redis.set(this.key(client.client_id), JSON.stringify(client))
    await this.redis.sadd(this.indexKey(), client.client_id)
    this.invalidate(client.client_id)
  }

  async getClient(clientId) {
    const cached = this.cacheGet(clientId)
    if (cached) return cached

    const raw = await this.redis.get(this.key(clientId))
    if (!raw) return null

    const client = JSON.parse(raw)
    this.cacheSet(clientId, client)
    return client
  }

  async deleteClient(clientId) {
    await this.redis.del(this.key(clientId))
    await this.redis.srem(this.indexKey(), clientId)
    this.invalidate(clientId)
  }

  async listClientIds() {
    return await this.redis.smembers(this.indexKey())
  }

  async listClients() {
    const ids = await this.listClientIds()
    if (!ids.length) return []
    const raws = await this.redis.mget(ids.map((id) => this.key(id)))
    return raws.map((r) => (r ? JSON.parse(r) : null)).filter(Boolean)
  }

  async setActive(clientId, isActive) {
    const c = await this.getClient(clientId)
    if (!c) return false

    c.is_active = Boolean(isActive)
    c.updated_at = new Date().toISOString()

    await this.redis.set(this.key(clientId), JSON.stringify(c))
    await this.redis.sadd(this.indexKey(), clientId)
    this.invalidate(clientId)
    return true
  }
}
