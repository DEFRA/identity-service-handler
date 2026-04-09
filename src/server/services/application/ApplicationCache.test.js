import { afterEach, describe, expect, test, vi } from 'vitest'
import { ApplicationCache } from './ApplicationCache.js'

const mocks = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  clientGet: vi.fn()
}

describe('ApplicationCache', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getClient()', () => {
    test('it returns the cached client when cache hits', async () => {
      // Arrange
      const client = { id: 'client-1', name: 'Test App' }
      const cache = new ApplicationCache(
        { get: mocks.get },
        { get: mocks.clientGet }
      )
      mocks.get.mockResolvedValue(JSON.stringify(client))

      // Act
      const result = await cache.get('client-1')

      // Assert
      expect(result).toEqual(client)
      expect(mocks.clientGet).not.toHaveBeenCalled()
    })

    test('it fetches from the client and caches the result on cache miss', async () => {
      // Arrange
      const client = { id: 'client-1', name: 'Test App' }
      const cache = new ApplicationCache(
        { get: mocks.get, set: mocks.set },
        { get: mocks.clientGet },
        { ttlSeconds: 120 }
      )
      mocks.get.mockResolvedValue(null)
      mocks.clientGet.mockResolvedValue(client)

      // Act
      const result = await cache.get('client-1')

      // Assert
      expect(mocks.clientGet).toHaveBeenCalledWith('client-1')
      expect(mocks.set).toHaveBeenCalledWith(
        'application-cache:client-1',
        JSON.stringify(client),
        'EX',
        120
      )
      expect(result).toEqual(client)
    })

    test('it returns null when the client is not found', async () => {
      // Arrange
      const cache = new ApplicationCache(
        { get: mocks.get },
        { get: mocks.clientGet }
      )
      mocks.get.mockResolvedValue(null)
      mocks.clientGet.mockResolvedValue(null)

      // Act
      const result = await cache.get('client-1')

      // Assert
      expect(result).toBeNull()
      expect(mocks.set).not.toHaveBeenCalled()
    })
  })

  describe('invalidate()', () => {
    test('it deletes the cached entry for the given client id', async () => {
      // Arrange
      const cache = new ApplicationCache({ del: mocks.del }, {})

      // Act
      await cache.invalidate('client-1')

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('application-cache:client-1')
    })
  })
})
