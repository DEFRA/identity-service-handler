import { afterEach, describe, expect, test, vi } from 'vitest'
import { RedisAdapter } from './redis-adapter.js'

const mocks = {
  type: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
  sadd: vi.fn(),
  smembers: vi.fn(),
  scan: vi.fn()
}

describe('RedisAdapter', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('key()', () => {
    test('it returns a prefixed lowercase key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {})

      // Act
      const result = adapter.key('abc-123')

      // Assert
      expect(result).toBe('oidc:accesstoken:abc-123')
    })
  })

  describe('grantIndexKey()', () => {
    test('it returns a grant index key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {})

      // Act
      const result = adapter.grantIndexKey('grant-1')

      // Assert
      expect(result).toBe('oidc:grant_idx:grant-1')
    })
  })

  describe('legacyGrantIndexKey()', () => {
    test('it returns a legacy grant key', () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {})

      // Act
      const result = adapter.legacyGrantIndexKey('grant-1')

      // Assert
      expect(result).toBe('oidc:grant:grant-1')
    })
  })

  describe('upsert()', () => {
    test('it stores a payload without TTL when expiresIn is not set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set
      })
      mocks.type.mockResolvedValue('none')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' })

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1',
        JSON.stringify({ foo: 'bar' })
      )
      expect(mocks.set).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
    })

    test('it stores a payload with TTL when expiresIn is set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set
      })
      mocks.type.mockResolvedValue('none')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' }, 300)

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
        'oidc:accesstoken:id-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        300
      )
    })

    test('it deletes a corrupted key before storing', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set,
        del: mocks.del
      })
      mocks.type.mockResolvedValue('hash')

      // Act
      await adapter.upsert('id-1', { foo: 'bar' })

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('oidc:accesstoken:id-1')
      expect(mocks.set).toHaveBeenCalled()
    })

    test('it adds to the grant index when grantId is present', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set,
        sadd: mocks.sadd,
        expire: mocks.expire
      })
      mocks.type.mockResolvedValueOnce('none') // key type
      mocks.type.mockResolvedValueOnce('none') // grantIndexKey type

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' }, 300)

      // Assert
      expect(mocks.sadd).toHaveBeenCalledWith(
        'oidc:grant_idx:grant-1',
        'oidc:accesstoken:id-1'
      )
      expect(mocks.expire).toHaveBeenCalledWith('oidc:grant_idx:grant-1', 300)
    })

    test('it deletes a corrupted grant index key before adding', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set,
        del: mocks.del,
        sadd: mocks.sadd
      })
      mocks.type.mockResolvedValueOnce('none') // key type
      mocks.type.mockResolvedValueOnce('hash') // grantIndexKey type (corrupted)

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' })

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant_idx:grant-1')
      expect(mocks.sadd).toHaveBeenCalled()
    })

    test('it does not set expiry on grant index when expiresIn is not set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        set: mocks.set,
        sadd: mocks.sadd,
        expire: mocks.expire
      })
      mocks.type.mockResolvedValueOnce('none')
      mocks.type.mockResolvedValueOnce('none')

      // Act
      await adapter.upsert('id-1', { grantId: 'grant-1' })

      // Assert
      expect(mocks.expire).not.toHaveBeenCalled()
    })
  })

  describe('find()', () => {
    test('it returns undefined when key does not exist', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get
      })
      mocks.type.mockResolvedValue('none')

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toBeUndefined()
      expect(mocks.get).not.toHaveBeenCalled()
    })

    test('it returns the parsed payload when key exists', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get
      })
      const payload = { sub: 'user-1' }
      mocks.type.mockResolvedValue('string')
      mocks.get.mockResolvedValue(JSON.stringify(payload))

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it deletes a corrupted key and returns undefined', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        del: mocks.del
      })
      mocks.type.mockResolvedValue('hash')

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('oidc:accesstoken:id-1')
      expect(result).toBeUndefined()
    })

    test('it returns undefined when key exists but data is empty', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get
      })
      mocks.type.mockResolvedValue('string')
      mocks.get.mockResolvedValue(null)

      // Act
      const result = await adapter.find('id-1')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('destroy()', () => {
    test('it deletes the key', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', { del: mocks.del })

      // Act
      await adapter.destroy('id-1')

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('oidc:accesstoken:id-1')
    })
  })

  describe('revokeByGrantId()', () => {
    test('it deletes all indexed keys and the grant index key when type is set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        smembers: mocks.smembers,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('set') // grantIndexKey
      mocks.smembers.mockResolvedValue(['key-1', 'key-2'])
      mocks.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.smembers).toHaveBeenCalledWith('oidc:grant_idx:grant-1')
      expect(mocks.del).toHaveBeenCalledWith(['key-1', 'key-2'])
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant_idx:grant-1')
    })

    test('it only deletes the grant index key when type is neither set nor none', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        smembers: mocks.smembers,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('string') // grantIndexKey (corrupted)
      mocks.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.smembers).not.toHaveBeenCalled()
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant_idx:grant-1')
    })

    test('it skips grant index deletion when type is none', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.type.mockResolvedValueOnce('none') // legacyGrantIndexKey

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.del).not.toHaveBeenCalled()
    })

    test('it cleans up a legacy grant index key when it is a set', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        smembers: mocks.smembers,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.type.mockResolvedValueOnce('set') // legacyGrantIndexKey
      mocks.smembers.mockResolvedValue(['legacy-key-1'])

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.smembers).toHaveBeenCalledWith('oidc:grant:grant-1')
      expect(mocks.del).toHaveBeenCalledWith(['legacy-key-1'])
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant:grant-1')
    })

    test('it skips del of indexed keys when smembers returns empty array', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        smembers: mocks.smembers,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('set')
      mocks.smembers.mockResolvedValue([])
      mocks.type.mockResolvedValueOnce('none')

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.del).not.toHaveBeenCalledWith([])
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant_idx:grant-1')
    })

    test('it skips del of legacy indexed keys when legacy smembers returns empty array', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        smembers: mocks.smembers,
        del: mocks.del
      })
      mocks.type.mockResolvedValueOnce('none') // grantIndexKey
      mocks.type.mockResolvedValueOnce('set') // legacyGrantIndexKey
      mocks.smembers.mockResolvedValue([])

      // Act
      await adapter.revokeByGrantId('grant-1')

      // Assert
      expect(mocks.del).not.toHaveBeenCalledWith([])
      expect(mocks.del).toHaveBeenCalledWith('oidc:grant:grant-1')
    })
  })

  describe('findByUid()', () => {
    test('it returns undefined when no keys match', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        options: { keyPrefix: 'prefix:' }
      })
      mocks.scan.mockResolvedValue(['0', []])

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it returns the payload whose uid matches', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        get: mocks.get,
        options: { keyPrefix: 'prefix:' }
      })
      const payload = { uid: 'uid-1', sub: 'user-1' }
      mocks.scan.mockResolvedValue(['0', ['prefix:oidc:accesstoken:id-1']])
      mocks.get.mockResolvedValueOnce(JSON.stringify(payload))

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it skips keys whose uid does not match', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        get: mocks.get,
        options: { keyPrefix: 'prefix:' }
      })
      const payload = { uid: 'uid-other', sub: 'user-1' }
      mocks.scan.mockResolvedValue(['0', ['prefix:oidc:accesstoken:id-1']])
      mocks.get.mockResolvedValueOnce(JSON.stringify(payload))

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it falls back to a non-prefixed key when first get returns null', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        get: mocks.get,
        options: { keyPrefix: 'prefix:' }
      })
      const payload = { uid: 'uid-1', sub: 'user-1' }
      mocks.scan.mockResolvedValue(['0', ['prefix:oidc:accesstoken:id-1']])
      mocks.get.mockResolvedValueOnce(null) // prefixed key miss
      mocks.get.mockResolvedValueOnce(JSON.stringify(payload)) // unprefixed key hit

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toEqual(payload)
    })

    test('it returns undefined when both prefixed and unprefixed gets return null', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        get: mocks.get,
        options: { keyPrefix: 'prefix:' }
      })
      mocks.scan.mockResolvedValue(['0', ['prefix:oidc:accesstoken:id-1']])
      mocks.get.mockResolvedValueOnce(null)
      mocks.get.mockResolvedValueOnce(null)

      // Act
      const result = await adapter.findByUid('uid-1')

      // Assert
      expect(result).toBeUndefined()
    })

    test('it iterates multiple scan pages until cursor is 0', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        scan: mocks.scan,
        options: { keyPrefix: 'prefix:' }
      })
      mocks.scan.mockResolvedValueOnce(['42', []])
      mocks.scan.mockResolvedValueOnce(['0', []])

      // Act
      await adapter.findByUid('uid-1')

      // Assert
      expect(mocks.scan).toHaveBeenCalledTimes(2)
    })
  })

  describe('consume()', () => {
    test('it returns early when key type is not string', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get,
        set: mocks.set
      })
      mocks.type.mockResolvedValue('none')

      // Act
      await adapter.consume('id-1')

      // Assert
      expect(mocks.get).not.toHaveBeenCalled()
      expect(mocks.set).not.toHaveBeenCalled()
    })

    test('it returns early when no data is found', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get,
        set: mocks.set
      })
      mocks.type.mockResolvedValue('string')
      mocks.get.mockResolvedValue(null)

      // Act
      await adapter.consume('id-1')

      // Assert
      expect(mocks.set).not.toHaveBeenCalled()
    })

    test('it sets a consumed timestamp on the payload', async () => {
      // Arrange
      const adapter = new RedisAdapter('AccessToken', {
        type: mocks.type,
        get: mocks.get,
        set: mocks.set
      })
      const payload = { sub: 'user-1' }
      mocks.type.mockResolvedValue('string')
      mocks.get.mockResolvedValue(JSON.stringify(payload))
      const before = Math.floor(Date.now() / 1000)

      // Act
      await adapter.consume('id-1')

      // Assert
      const [, storedValue] = mocks.set.mock.lastCall
      const stored = JSON.parse(storedValue)
      expect(stored.sub).toBe('user-1')
      expect(stored.consumed).toBeGreaterThanOrEqual(before)
      expect(stored.consumed).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
    })
  })
})
