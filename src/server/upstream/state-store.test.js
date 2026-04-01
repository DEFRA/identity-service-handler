import { afterEach, describe, expect, test, vi } from 'vitest'
import { UpstreamStateStore } from './state-store.js'

const mocks = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}

describe('UpstreamStateStore', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('put()', () => {
    test('it stores the record with the default TTL', async () => {
      // Arrange
      const store = new UpstreamStateStore({ set: mocks.set })

      // Act
      await store.put('state-1', { foo: 'bar' })

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
        'upstream:state:state-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        600
      )
    })

    test('it stores the record with a custom TTL', async () => {
      // Arrange
      const store = new UpstreamStateStore({ set: mocks.set })

      // Act
      await store.put('state-1', { foo: 'bar' }, 300)

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
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
      const store = new UpstreamStateStore({ get: mocks.get })
      const record = { foo: 'bar' }
      mocks.get.mockResolvedValue(JSON.stringify(record))

      // Act
      const result = await store.get('state-1')

      // Assert
      expect(mocks.get).toHaveBeenCalledWith('upstream:state:state-1')
      expect(result).toEqual(record)
    })

    test('it returns null when no data exists', async () => {
      // Arrange
      const store = new UpstreamStateStore({ get: mocks.get })
      mocks.get.mockResolvedValue(null)

      // Act
      const result = await store.get('state-1')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('del()', () => {
    test('it deletes the record by state key', async () => {
      // Arrange
      const store = new UpstreamStateStore({ del: mocks.del })

      // Act
      await store.del('state-1')

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('upstream:state:state-1')
    })
  })

  describe('putByUid()', () => {
    test('it stores the record with the default TTL', async () => {
      // Arrange
      const store = new UpstreamStateStore({ set: mocks.set })

      // Act
      await store.putByUid('uid-1', { foo: 'bar' })

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
        'upstream:uid:uid-1',
        JSON.stringify({ foo: 'bar' }),
        'EX',
        600
      )
    })

    test('it stores the record with a custom TTL', async () => {
      // Arrange
      const store = new UpstreamStateStore({ set: mocks.set })

      // Act
      await store.putByUid('uid-1', { foo: 'bar' }, 120)

      // Assert
      expect(mocks.set).toHaveBeenCalledWith(
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
      const store = new UpstreamStateStore({ get: mocks.get })
      const record = { foo: 'bar' }
      mocks.get.mockResolvedValue(JSON.stringify(record))

      // Act
      const result = await store.getByUid('uid-1')

      // Assert
      expect(mocks.get).toHaveBeenCalledWith('upstream:uid:uid-1')
      expect(result).toEqual(record)
    })

    test('it returns null when no data exists', async () => {
      // Arrange
      const store = new UpstreamStateStore({ get: mocks.get })
      mocks.get.mockResolvedValue(null)

      // Act
      const result = await store.getByUid('uid-1')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('delByUid()', () => {
    test('it deletes the record by uid key', async () => {
      // Arrange
      const store = new UpstreamStateStore({ del: mocks.del })

      // Act
      await store.delByUid('uid-1')

      // Assert
      expect(mocks.del).toHaveBeenCalledWith('upstream:uid:uid-1')
    })
  })
})
