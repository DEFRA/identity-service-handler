import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../../clients/helperClient.js'
import { getUserDetails, getUserCphs } from './service.js'

const mocks = {
  helperClientGet: vi.spyOn(helperClient, 'get')
}

describe('User Service', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getUserDetails()', () => {
    test('it returns user details for the given email', async () => {
      // Arrange
      mocks.helperClientGet.mockResolvedValue({
        payload: {
          display_name: 'Test User',
          given_name: 'Test',
          family_name: 'User'
        }
      })

      // Act
      const result = await getUserDetails('user@example.com')

      // Assert
      expect(result).toEqual({
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
      expect(mocks.helperClientGet).toHaveBeenCalledWith(
        '/user/user@example.com'
      )
    })
  })

  describe('getUserCphs()', () => {
    test('it returns user cph assignments for the given email', async () => {
      // Arrange
      mocks.helperClientGet.mockResolvedValue({
        payload: {
          primary_cph: [{ cph: '123', role: 'Owner' }],
          delegated_cph: []
        }
      })

      // Act
      const result = await getUserCphs('user@example.com')

      // Assert
      expect(result).toEqual({
        primary_cph: [{ cph: '123', role: 'Owner' }],
        delegated_cph: []
      })
      expect(mocks.helperClientGet).toHaveBeenCalledWith(
        '/user/user@example.com/cphs'
      )
    })
  })
})
