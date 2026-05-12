import { afterEach, describe, expect, test, vi } from 'vitest'
import { redisClient } from '../common/helpers/redis-client.js'
import * as stateStore from './state-store.js'

const mocks = {
  redisClient: {
    get: vi.spyOn(redisClient, 'get'),
    set: vi.spyOn(redisClient, 'set'),
    del: vi.spyOn(redisClient, 'del')
  }
}

describe('state-store', () => {
  beforeEach(() => {
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.redisClient.set.mockResolvedValue('OK')
    mocks.redisClient.del.mockResolvedValue(1)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('put()', () => {
    test('it stores the record with the default TTL', async () => {
      // Act
      await stateStore.put('state-1', { foo: 'bar' })

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'upstream:state:state-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        600
      )
    })

    test('it stores the record with a custom TTL', async () => {
      // Act
      await stateStore.put('state-1', { foo: 'bar' }, 300)

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'upstream:state:state-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        300
      )
    })
  })

  describe('get()', () => {
    test('it returns the parsed record when data exists', async () => {
      // Arrange
      const record = { foo: 'bar' }
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(record))

      // Act
      const result = await stateStore.get('state-1')

      // Assert
      expect(mocks.redisClient.get).toHaveBeenCalledWith(
        'upstream:state:state-1'
      )
      expect(result).toEqual(record)
    })

    test('it returns null when no data exists', async () => {
      // Arrange
      mocks.redisClient.get.mockResolvedValue(null)

      // Act
      const result = await stateStore.get('state-1')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('del()', () => {
    test('it deletes the record by state key', async () => {
      // Act
      await stateStore.del('state-1')

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith(
        'upstream:state:state-1'
      )
    })
  })

  describe('putByUid()', () => {
    test('it stores the record with the default TTL', async () => {
      // Act
      await stateStore.putByUid('uid-1', { foo: 'bar' })

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'upstream:uid:uid-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        600
      )
    })

    test('it stores the record with a custom TTL', async () => {
      // Act
      await stateStore.putByUid('uid-1', { foo: 'bar' }, 120)

      // Assert
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'upstream:uid:uid-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        120
      )
    })
  })

  describe('getByUid()', () => {
    test('it returns the parsed record when data exists', async () => {
      // Arrange
      const record = { foo: 'bar' }
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(record))

      // Act
      const result = await stateStore.getByUid('uid-1')

      // Assert
      expect(mocks.redisClient.get).toHaveBeenCalledWith('upstream:uid:uid-1')
      expect(result).toEqual(record)
    })

    test('it returns null when no data exists', async () => {
      // Arrange
      mocks.redisClient.get.mockResolvedValue(null)

      // Act
      const result = await stateStore.getByUid('uid-1')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('delByUid()', () => {
    test('it deletes the record by uid key', async () => {
      // Act
      await stateStore.delByUid('uid-1')

      // Assert
      expect(mocks.redisClient.del).toHaveBeenCalledWith('upstream:uid:uid-1')
    })
  })
})
