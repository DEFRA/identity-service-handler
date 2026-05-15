import { afterEach, describe, expect, test, vi } from 'vitest'

import { DelegationBuilder } from './DelegationBuilder.js'

const mocks = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn()
}

describe('DelegationBuilder', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getDraft()', () => {
    test('it returns the cached draft on subsequent calls without reading yar again', () => {
      // Arrange
      const request = { yar: { get: mocks.get } }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({ email: 'joe@example.gov.uk' })

      // Act
      builder.getDraft()
      builder.getDraft()

      // Assert
      expect(mocks.get).toHaveBeenCalledTimes(1)
    })

    test('it returns an empty object when yar has no draft', () => {
      // Arrange
      const request = { yar: { get: mocks.get } }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue(null)

      // Act
      const result = builder.getDraft()

      // Assert
      expect(result).toEqual({})
    })

    test('it accepts a bare yar object instead of a request wrapper', () => {
      // Arrange
      const yar = { get: mocks.get }
      const builder = new DelegationBuilder(yar)
      mocks.get.mockReturnValue({ email: 'joe@example.gov.uk' })

      // Act
      const result = builder.getEmail()

      // Assert
      expect(result).toBe('joe@example.gov.uk')
    })
  })

  describe('getEmail()', () => {
    test('it returns the stored email', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({ email: 'joe@example.gov.uk' })

      // Act
      const result = builder.getEmail()

      // Assert
      expect(result).toBe('joe@example.gov.uk')
    })
  })

  describe('setEmail()', () => {
    test('it stores the email and preserves the existing draft', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get,
          set: mocks.set
        }
      }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({
        cphIds: ['12/345/6789']
      })

      // Act
      const result = builder.setEmail('joe@example.gov.uk')

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        email: 'joe@example.gov.uk',
        cphIds: ['12/345/6789']
      })
      expect(result).toEqual({
        email: 'joe@example.gov.uk',
        cphIds: ['12/345/6789']
      })
    })
  })

  describe('getCphs()', () => {
    test('it returns the stored cph values', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({ cphIds: ['12/345/6789'] })

      // Act
      const result = builder.getCphIds()

      // Assert
      expect(result).toEqual(['12/345/6789'])
    })

    test('it returns an empty array when no cph values are stored', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({})

      // Act
      const result = builder.getCphIds()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('setCphs()', () => {
    test('it stores the cph values and preserves the existing draft', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get,
          set: mocks.set
        }
      }
      const builder = new DelegationBuilder(request)
      mocks.get.mockReturnValue({ email: 'joe@example.gov.uk' })

      // Act
      const result = builder.setCphIds(['12/345/6789'])

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        email: 'joe@example.gov.uk',
        cphIds: ['12/345/6789']
      })
      expect(result).toEqual({
        email: 'joe@example.gov.uk',
        cphIds: ['12/345/6789']
      })
    })
  })

  describe('clearDraft()', () => {
    test('it clears the draft from the session', () => {
      // Arrange
      const request = {
        yar: {
          clear: mocks.clear
        }
      }
      const builder = new DelegationBuilder(request)

      // Act
      builder.clearDraft()

      // Assert
      expect(mocks.clear).toHaveBeenCalledWith('delegationDraft')
    })
  })
})
