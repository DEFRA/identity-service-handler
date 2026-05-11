import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../../clients/helperClient.js'
import { getUserProfile } from './service.js'

const mocks = {
  helperClientGet: vi.spyOn(helperClient, 'get')
}

describe('User Service', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getUserProfile()', () => {
    test('it returns the user profile for the given user id', async () => {
      // Arrange
      const profile = {
        user_details: {
          id: 'sub-1',
          email: 'user@example.gov.uk',
          first_name: 'Test',
          last_name: 'User',
          display_name: 'Test User'
        },
        direct_assignments: [{ county_parish_holding_number: '12/345/6789' }],
        inbound_delegations: [],
        outbound_delegations: []
      }
      mocks.helperClientGet.mockResolvedValue({ payload: profile })

      // Act
      const result = await getUserProfile('sub-1')

      // Assert
      expect(result).toEqual(profile)
      expect(mocks.helperClientGet).toHaveBeenCalledWith('/users/sub-1/profile')
    })
  })
})
