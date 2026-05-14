import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { redisClient } from '../../common/helpers/redis-client.js'
import { RedisAdapter } from './redis-adapter.js'

redisClient.options = { keyPrefix: 'prefix:' }

const mocks = {
  redisClient: {
    type: vi.spyOn(redisClient, 'type'),
    get: vi.spyOn(redisClient, 'get'),
    set: vi.spyOn(redisClient, 'set'),
    del: vi.spyOn(redisClient, 'del'),
    expire: vi.spyOn(redisClient, 'expire'),
    sadd: vi.spyOn(redisClient, 'sadd'),
    smembers: vi.spyOn(redisClient, 'smembers'),
    scan: vi.spyOn(redisClient, 'scan')
  }
}

describe('RedisAdapter', () => {
  beforeEach(() => {
    mocks.redisClient.type.mockResolvedValue('none')
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.redisClient.set.mockResolvedValue('OK')
    mocks.redisClient.del.mockResolvedValue(1)
    mocks.redisClient.expire.mockResolvedValue(1)
    mocks.redisClient.sadd.mockResolvedValue(1)
    mocks.redisClient.smembers.mockResolvedValue([])
    mocks.redisClient.scan.mockResolvedValue(['0', []])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('key()', () => {
    test('it returns a prefixed lowercase key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      const result = adapter.key('abc-123')

      // Assert
      expect(result).toBe('oidc:accesstoken:abc-123')
    })
  })

  describe('grantIndexKey()', () => {
    test('it returns a grant index key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      const result = adapter.grantIndexKey('grant-1')

      // Assert
      expect(result).toBe('oidc:grant_idx:grant-1')
    })
  })

  describe('legacyGrantIndexKey()', () => {
    test('it returns a legacy grant key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      const result = adapter.legacyGrantIndexKey('grant-1')

      // Assert
      expect(result).toBe('oidc:grant:grant-1')
    })
  })

  describe('upsert()', () => {
    test('it stores a payload without TTL when expiresIn is not set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' })

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1',
        JSON.stringify({ foo: 'bar' })
      )
      expect(mocks.redisClient.set).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
    })

    test('it stores a payload with TTL when expiresIn is set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' }, 300)

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        300
      )
    })

    test('it deletes a corrupted key before storing', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValue('hash')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' })

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1'
      )
      expect(mocks.redisClient.set).toHaveBeenCalled()
    })

    test('it adds to the grant index when grantId is present', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none') // key type
      mocks.redisClient.type.mockResolvedValueOnce('none') // grantIndexKey type

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' }, 300)

      // Assert
      expect(mocks.redisClient.sadd).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1',
        'oidc:accesstoken:id-1'
      )
      expect(mocks.redisClient.expire).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1',
        300
      )
    })

    test('it deletes a corrupted grant index key before adding', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none') // key type
      mocks.redisClient.type.mockResolvedValueOnce('hash') // grantIndexKey type (corrupted)

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' })

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1'
      )
      expect(mocks.redisClient.sadd).toHaveBeenCalled()
    })

    test('it does not set expiry on grant index when expiresIn is not set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none')
      mocks.redisClient.type.mockResolvedValueOnce('none')

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' })

      // Assert
      expect(mocks.redisClient.expire).not.toHaveBeenCalled()
    })
  })

  describe('find()', () => {
    test('it returns undefined when key does not exist', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toBeUndefined()
      expect(mocks.redisClient.get).not.toHaveBeenCalled()
    })

    test('it returns the parsed payload when key exists', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      const payload = { sub: 'user-1' }
      mocks.redisClient.type.mockResolvedValue('string')
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(payload))

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it deletes a corrupted key and returns undefined', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValue('hash')

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1'
      )
      expect(result).toBeUndefined()
    })

    test('it returns undefined when key exists but data is empty', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValue('string')

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('destroy()', () => {
    test('it deletes the key', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      await adapter.destroy('id-1')

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1'
      )
    })
  })

  describe('revokeByGrantId()', () => {
    test('it deletes all indexed keys and the grant index key when type is set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('set') // grantIndexKey
      mocks.redisClient.smembers.mockResolvedValue(['key-1', 'key-2'])
      mocks.redisClient.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.smembers).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1'
      )
      expect(mocks.redisClient.del).toHaveBeenCalledWith(['key-1', 'key-2'])
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1'
      )
    })

    test('it only deletes the grant index key when type is neither set nor none', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('string') // grantIndexKey (corrupted)
      mocks.redisClient.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.smembers).not.toHaveBeenCalled()
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1'
      )
    })

    test('it skips grant index deletion when type is none', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.redisClient.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.del).not.toHaveBeenCalled()
    })

    test('it cleans up a legacy grant index key when it is a set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.redisClient.type.mockResolvedValueOnce('set') // legacyGrantIndexKey
      mocks.redisClient.smembers.mockResolvedValue(['legacy-key-1'])

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.smembers).toHaveBeenCalledWith(
        'oidc:grant:grant-1'
      )
      expect(mocks.redisClient.del).toHaveBeenCalledWith(['legacy-key-1'])
      expect(mocks.redisClient.del).toHaveBeenCalledWith('oidc:grant:grant-1')
    })

    test('it skips del of indexed keys when smembers returns empty array', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('set')
      mocks.redisClient.smembers.mockResolvedValue([])
      mocks.redisClient.type.mockResolvedValueOnce('none')

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.del).not.toHaveBeenCalledWith([])
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1'
      )
    })

    test('it skips del of legacy indexed keys when legacy smembers returns empty array', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.redisClient.type.mockResolvedValueOnce('set') // legacyGrantIndexKey
      mocks.redisClient.smembers.mockResolvedValue([])

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.redisClient.del).not.toHaveBeenCalledWith([])
      expect(mocks.redisClient.del).toHaveBeenCalledWith('oidc:grant:grant-1')
    })
  })

  describe('findByUid()', () => {
    test('it returns undefined when no keys match', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it returns the payload whose uid matches', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      const payload = { uid: 'uid-1', sub: 'user-1' }
      mocks.redisClient.scan.mockResolvedValue([
        '0',
        ['prefix:oidc:accesstoken:id-1']
      ])
      mocks.redisClient.get.mockResolvedValueOnce(JSON.stringify(payload))

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it skips keys whose uid does not match', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      const payload = { uid: 'uid-other', sub: 'user-1' }
      mocks.redisClient.scan.mockResolvedValue([
        '0',
        ['prefix:oidc:accesstoken:id-1']
      ])
      mocks.redisClient.get.mockResolvedValueOnce(JSON.stringify(payload))

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it falls back to a non-prefixed key when first get returns null', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      const payload = { uid: 'uid-1', sub: 'user-1' }
      mocks.redisClient.scan.mockResolvedValue([
        '0',
        ['prefix:oidc:accesstoken:id-1']
      ])
      mocks.redisClient.get.mockResolvedValueOnce(null) // prefixed key miss
      mocks.redisClient.get.mockResolvedValueOnce(JSON.stringify(payload)) // unprefixed key hit

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it returns undefined when both prefixed and unprefixed gets return null', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.scan.mockResolvedValue([
        '0',
        ['prefix:oidc:accesstoken:id-1']
      ])
      mocks.redisClient.get.mockResolvedValueOnce(null)
      mocks.redisClient.get.mockResolvedValueOnce(null)

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it iterates multiple scan pages until cursor is 0', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.scan.mockResolvedValueOnce(['42', []])
      mocks.redisClient.scan.mockResolvedValueOnce(['0', []])

      // Act
      await adapter.findByUid('uid-1')

      // Assert
      expect(mocks.redisClient.scan).toHaveBeenCalledTimes(2)
    })
  })

  describe('consume()', () => {
    test('it returns early when key type is not string', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')

      // Act
      await adapter.consume('id-1')

      // Assert
      expect(mocks.redisClient.get).not.toHaveBeenCalled()
      expect(mocks.redisClient.set).not.toHaveBeenCalled()
    })

    test('it returns early when no data is found', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      mocks.redisClient.type.mockResolvedValue('string')

      // Act
      await adapter.consume('id-1')

      // Assert
      expect(mocks.redisClient.set).not.toHaveBeenCalled()
    })

    test('it sets a consumed timestamp on the payload', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken')
      const payload = { sub: 'user-1' }
      mocks.redisClient.type.mockResolvedValue('string')
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(payload))
      const before = Math.floor(Date.now() / 1000)

      // Act
      await adapter.consume('id-1')

      // Assert
      const [, storedValue] = mocks.redisClient.set.mock.lastCall
      const stored = JSON.parse(storedValue)
      expect(stored.sub).toBe('user-1')
      expect(stored.consumed).toBeGreaterThanOrEqual(before)
      expect(stored.consumed).toBeLessThanOrEqual(Math.round(Date.now() / 1000))
    })
  })
})
