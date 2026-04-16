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
      const result = await getUserDetails('sub-1')

      // Assert
      expect(result).toEqual({
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
      expect(mocks.helperClientGet).toHaveBeenCalledWith('/users/sub-1')
    })
  })

  describe('getUserCphs()', () => {
    test('it returns user cph assignments for the given email', async () => {
      // Arrange
      mocks.helperClientGet.mockResolvedValue({
        payload: {
          associations: [
            {
              county_parish_holding_number: '123',
              association_id: 'a1',
              county_parish_holding_id: 'c1',
              application_id: 'ap1',
              role_id: 'r1'
            }
          ],
          delegations: []
        }
      })

      // Act
      const result = await getUserCphs('sub-2')

      // Assert
      expect(result).toEqual({
        associations: [
          {
            county_parish_holding_number: '123',
            association_id: 'a1',
            county_parish_holding_id: 'c1',
            application_id: 'ap1',
            role_id: 'r1'
          }
        ],
        delegations: []
      })
      expect(mocks.helperClientGet).toHaveBeenCalledWith('/users/sub-2/cphs')
    })
  })
})
