import { afterEach, describe, expect, test, vi } from 'vitest'
import { redisClient } from '../common/helpers/redis-client.js'
import * as subjectsService from './subjects.js'

const mocks = {
  redisClient: {
    get: vi.spyOn(redisClient, 'get'),
    set: vi.spyOn(redisClient, 'set')
  }
}

describe('SubjectsService', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('get()', () => {
    test('it returns the parsed mapping for a sub', async () => {
      // Arrange
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(mapping))

      // Act
      const result = await subjectsService.get('upstream-sub')

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redisClient.get).toHaveBeenCalledWith(
        'subject-map:upstream-sub'
      )
    })
  })

  describe('create()', () => {
    test('it persists and returns a new subject mapping', async () => {
      // Arrange
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redisClient.set.mockResolvedValue('OK')

      // Act
      const result = await subjectsService.create(mapping)

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'subject-map:upstream-sub',
        JSON.stringify(mapping)
      )
    })
  })

  describe('getOrCreateBrokerSub()', () => {
    test('it returns an existing mapping when one is already stored', async () => {
      // Arrange
      const existing = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redisClient.get.mockResolvedValue(JSON.stringify(existing))

      // Act
      const result = await subjectsService.getOrCreateBrokerSub(existing)

      // Assert
      expect(result).toEqual(existing)
      expect(mocks.redisClient.set).not.toHaveBeenCalled()
    })

    test('it creates a new mapping when one is not stored', async () => {
      // Arrange
      const mapping = {
        sub: 'upstream-sub',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
      mocks.redisClient.get.mockResolvedValue(undefined)
      mocks.redisClient.set.mockResolvedValue('OK')

      // Act
      const result = await subjectsService.getOrCreateBrokerSub(mapping)

      // Assert
      expect(result).toEqual(mapping)
      expect(mocks.redisClient.get).toHaveBeenCalledWith(
        'subject-map:upstream-sub'
      )
      expect(mocks.redisClient.set).toHaveBeenCalledWith(
        'subject-map:upstream-sub',
        JSON.stringify(mapping)
      )
    })
  })
})
