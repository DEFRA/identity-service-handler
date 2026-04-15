import { afterEach, describe, expect, test, vi } from 'vitest'

import { SubjectsService } from './subjects.js'

const mocks = {
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}

describe('SubjectsService', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('get()', () => {
    test('it returns the parsed mapping for a sub', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redis.get.mockResolvedValue(JSON.stringify(mapping))

      // Act
      const result = await service.get('upstream-sub')

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redis.get).toHaveBeenCalledWith('subject-map:upstream-sub')
    })
  })

  describe('create()', () => {
    test('it persists and returns a new subject mapping', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redis.set.mockResolvedValue('OK')

      // Act
      const result = await service.create(mapping)

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redis.set).toHaveBeenCalledWith(
        'subject-map:upstream-sub',
        JSON.stringify(mapping)
      )
    })
  })

  describe('getOrCreateBrokerSub()', () => {
    test('it returns an existing mapping when one is already stored', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const existing = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redis.get.mockResolvedValue(JSON.stringify(existing))

      // Act
      const result = await service.getOrCreateBrokerSub(existing)

      // Assert
      expect(result).toEqual(existing)
      expect(mocks.redis.set).not.toHaveBeenCalled()
    })

    test('it creates a new mapping when one is not stored', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')

      // Act
      const result = await service.getOrCreateBrokerSub(mapping)

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redis.get).toHaveBeenCalledWith('subject-map:upstream-sub')
      expect(mocks.redis.set).toHaveBeenCalledWith(
        'subject-map:upstream-sub',
        JSON.stringify(mapping)
      )
    })
  })
})
