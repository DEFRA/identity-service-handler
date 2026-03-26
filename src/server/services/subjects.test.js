import { createHash } from 'node:crypto'
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
    test('it returns the parsed mapping for a broker sub', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      mocks.redis.get.mockResolvedValue(
        JSON.stringify({ sub: 'broker-sub', email: 'user@example.com' })
      )

      // Act
      const result = await service.get('broker-sub')

      // Assert
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'user@example.com'
      })
      expect(mocks.redis.get).toHaveBeenCalledWith('subject-map:broker-sub')
    })
  })

  describe('create()', () => {
    test('it persists and returns a new broker mapping', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      mocks.redis.set.mockResolvedValue('OK')

      // Act
      const result = await service.create('broker-sub', 'user@example.com')

      // Assert
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'user@example.com'
      })
      expect(mocks.redis.set).toHaveBeenCalledWith(
        'subject-map:broker-sub',
        JSON.stringify({ sub: 'broker-sub', email: 'user@example.com' })
      )
    })
  })

  describe('getOrCreateBrokerSub()', () => {
    test('it returns an existing mapping when one is already stored', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const existing = {
        sub: 'existing-broker-sub',
        email: 'user@example.com'
      }
      mocks.redis.get.mockResolvedValue(JSON.stringify(existing))

      // Act
      const result = await service.getOrCreateBrokerSub(
        'issuer',
        'upstream-sub',
        'new@example.com'
      )

      // Assert
      expect(result).toEqual(existing)
      expect(mocks.redis.set).not.toHaveBeenCalled()
    })

    test('it creates a deterministic broker mapping when one is not stored', async () => {
      // Arrange
      const service = new SubjectsService(mocks.redis)
      const brokerSub = createHash('sha256')
        .update('issuer|upstream-sub|user@example.com')
        .digest('hex')
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')

      // Act
      const result = await service.getOrCreateBrokerSub(
        'issuer',
        'upstream-sub',
        'user@example.com'
      )

      // Assert
      expect(result).toEqual({
        sub: brokerSub,
        email: 'user@example.com'
      })
      expect(mocks.redis.get).toHaveBeenCalledWith(`subject-map:${brokerSub}`)
      expect(mocks.redis.set).toHaveBeenCalledWith(
        `subject-map:${brokerSub}`,
        JSON.stringify({ sub: brokerSub, email: 'user@example.com' })
      )
    })
  })
})
