import { afterEach, describe, expect, test, vi } from 'vitest'
import { DelegationFakeService } from './service.fake.js'

const mocks = {
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}

const userId = 'user-123'

describe('DelegationFakeService', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getDelegations()', () => {
    test('it returns cached delegations when cache contains a valid array', async () => {
      // Arrange
      const cached = [
        { id: '1', name: 'One', email: 'o@example.gov.uk', active: true }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      const service = new DelegationFakeService(mocks.redis)

      // Act
      const result = await service.getDelegations(userId)

      // Assert
      expect(result).toEqual({
        page: 1,
        items: cached,
        total_pages: 1,
        total_items: 1
      })
      expect(mocks.redis.set).not.toHaveBeenCalled()
    })

    test('it falls back to dummy delegations and seeds redis when cache is empty', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(null)
      const service = new DelegationFakeService(mocks.redis)

      // Act
      const result = await service.getDelegations(userId)

      // Assert
      expect(result.page).toBe(1)
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.total_pages).toBeGreaterThan(0)
      expect(result.total_items).toBeGreaterThan(0)
      expect(mocks.redis.set).toHaveBeenCalledTimes(1)

      const [key, value] = mocks.redis.set.mock.lastCall
      expect(key).toBe(`delegates:${userId}`)
      expect(Array.isArray(JSON.parse(value))).toBe(true)
    })

    test('it returns the requested page of items', async () => {
      // Arrange
      const cached = [
        { id: '1', name: 'One', email: '1@example.gov.uk', active: true },
        { id: '2', name: 'Two', email: '2@example.gov.uk', active: true },
        { id: '3', name: 'Three', email: '3@example.gov.uk', active: true },
        { id: '4', name: 'Four', email: '4@example.gov.uk', active: true },
        { id: '5', name: 'Five', email: '5@example.gov.uk', active: true },
        { id: '6', name: 'Six', email: '6@example.gov.uk', active: true }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      const service = new DelegationFakeService(mocks.redis)

      // Act
      const result = await service.getDelegations(userId, 2)

      // Assert
      expect(result.page).toBe(2)
      expect(result.items).toEqual([cached[5]])
      expect(result.total_pages).toBe(2)
      expect(result.total_items).toBe(6)
    })

    test('it throws when cache contains malformed json', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue('{bad json')
      const service = new DelegationFakeService(mocks.redis)

      // Act
      let error
      try {
        await service.getDelegations(userId)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeDefined()
    })

    test('it throws when cache contains json that is not an array', async () => {
      // Arrange
      mocks.redis.get.mockResolvedValue(JSON.stringify({ id: 'not-array' }))
      const service = new DelegationFakeService(mocks.redis)

      // Act
      let error
      try {
        await service.getDelegations(userId)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error?.message).toBe('Malformed delegations')
    })
  })

  describe('getDelegation()', () => {
    test('it returns the matching delegation by id', async () => {
      // Arrange
      const cached = [
        { id: '1', name: 'One', email: 'o@example.gov.uk', active: true },
        { id: '2', name: 'Two', email: 't@example.gov.uk', active: false }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      const service = new DelegationFakeService(mocks.redis)

      // Act
      const result = await service.getDelegation(userId, '2')

      // Assert
      expect(result).toEqual(cached[1])
    })
  })

  describe('createInvite()', () => {
    test('it stores new invite when it does not already exist', async () => {
      // Arrange
      const cached = [
        { id: '1', name: 'One', email: 'o@example.gov.uk', active: true }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      mocks.redis.set.mockResolvedValue('OK')
      const service = new DelegationFakeService(mocks.redis)

      // Act
      await service.createInvite(userId, { email: 't@example.gov.uk' })

      // Assert
      const [key, value] = mocks.redis.set.mock.lastCall
      const parsedValue = JSON.parse(value)
      expect(key).toEqual(`delegates:${userId}`)
      expect(parsedValue[0]).toEqual(cached[0])
      expect(parsedValue.length).toEqual(2)
      expect(parsedValue[1]).toEqual({
        email: 't@example.gov.uk',
        id: expect.any(String),
        cphs: [],
        active: false
      })
    })
  })

  describe('updateDelegation()', () => {
    test('it merges updates onto the matching delegation and persists', async () => {
      // Arrange
      const cached = [
        { id: '1', email: 'o@example.gov.uk', cphs: [], active: true },
        { id: '2', email: 't@example.gov.uk', cphs: [], active: false }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      mocks.redis.set.mockResolvedValue('OK')
      const service = new DelegationFakeService(mocks.redis)

      // Act
      await service.updateDelegation(userId, '2', {
        email: 'updated@example.gov.uk',
        active: true
      })

      // Assert
      expect(mocks.redis.set).toHaveBeenCalledWith(
        `delegates:${userId}`,
        JSON.stringify([
          { id: '1', email: 'o@example.gov.uk', cphs: [], active: true },
          { id: '2', email: 'updated@example.gov.uk', cphs: [], active: true }
        ])
      )
    })

    test('it leaves non-matching delegations unchanged', async () => {
      // Arrange
      const cached = [
        { id: '1', email: 'o@example.gov.uk', cphs: [], active: true },
        { id: '2', email: 't@example.gov.uk', cphs: [], active: false }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      mocks.redis.set.mockResolvedValue('OK')
      const service = new DelegationFakeService(mocks.redis)

      // Act
      await service.updateDelegation(userId, '2', { active: true })

      // Assert
      const [, value] = mocks.redis.set.mock.lastCall
      const persisted = JSON.parse(value)
      expect(persisted[0]).toEqual(cached[0])
    })
  })

  describe('deleteDelegation()', () => {
    test('it removes matching delegation and persists updated array', async () => {
      // Arrange
      const cached = [
        { id: '1', name: 'One', email: 'o@example.gov.uk', active: true },
        { id: '2', name: 'Two', email: 't@example.gov.uk', active: false }
      ]
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      mocks.redis.set.mockResolvedValue('OK')
      const service = new DelegationFakeService(mocks.redis)

      // Act
      await service.deleteDelegation(userId, '2')

      // Assert
      expect(mocks.redis.set).toHaveBeenCalledWith(
        `delegates:${userId}`,
        JSON.stringify([
          { id: '1', name: 'One', email: 'o@example.gov.uk', active: true }
        ])
      )
    })
  })
})
