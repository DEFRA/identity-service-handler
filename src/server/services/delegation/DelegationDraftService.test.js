import { afterEach, describe, expect, test, vi } from 'vitest'

import { DelegationDraftService } from './DelegationDraftService.js'

const mocks = {
  get: vi.fn(),
  set: vi.fn(),
  clear: vi.fn()
}

describe('DelegationDraftService', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getFullName()', () => {
    test('it returns the stored full name', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({ fullName: 'Joe Bloggs' })

      // Act
      const result = service.getFullName()

      // Assert
      expect(result).toBe('Joe Bloggs')
    })
  })

  describe('setFullName()', () => {
    test('it stores the full name and preserves the existing draft', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get,
          set: mocks.set
        }
      }
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({
        email: 'joe@example.gov.uk',
        species: ['cattle']
      })

      // Act
      const result = service.setFullName('Joe Bloggs')

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        species: ['cattle']
      })
      expect(result).toEqual({
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        species: ['cattle']
      })
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
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({ email: 'joe@example.gov.uk' })

      // Act
      const result = service.getEmail()

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
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({
        fullName: 'Joe Bloggs',
        cphs: ['12/345/6789']
      })

      // Act
      const result = service.setEmail('joe@example.gov.uk')

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        cphs: ['12/345/6789']
      })
      expect(result).toEqual({
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        cphs: ['12/345/6789']
      })
    })
  })

  describe('getSpecies()', () => {
    test('it returns the stored species values', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({ species: ['cattle', 'sheep'] })

      // Act
      const result = service.getSpecies()

      // Assert
      expect(result).toEqual(['cattle', 'sheep'])
    })

    test('it returns an empty array when no species values are stored', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get
        }
      }
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({})

      // Act
      const result = service.getSpecies()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('setSpecies()', () => {
    test('it stores the species values and preserves the existing draft', () => {
      // Arrange
      const request = {
        yar: {
          get: mocks.get,
          set: mocks.set
        }
      }
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk'
      })

      // Act
      const result = service.setSpecies(['cattle', 'sheep'])

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        species: ['cattle', 'sheep']
      })
      expect(result).toEqual({
        fullName: 'Joe Bloggs',
        email: 'joe@example.gov.uk',
        species: ['cattle', 'sheep']
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
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({ cphs: ['12/345/6789'] })

      // Act
      const result = service.getCphs()

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
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({})

      // Act
      const result = service.getCphs()

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
      const service = new DelegationDraftService(request)
      mocks.get.mockReturnValue({ fullName: 'Joe Bloggs', species: ['cattle'] })

      // Act
      const result = service.setCphs(['12/345/6789'])

      // Assert
      expect(mocks.set).toHaveBeenCalledWith('delegationDraft', {
        fullName: 'Joe Bloggs',
        species: ['cattle'],
        cphs: ['12/345/6789']
      })
      expect(result).toEqual({
        fullName: 'Joe Bloggs',
        species: ['cattle'],
        cphs: ['12/345/6789']
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
      const service = new DelegationDraftService(request)

      // Act
      service.clearDraft()

      // Assert
      expect(mocks.clear).toHaveBeenCalledWith('delegationDraft')
    })
  })
})
