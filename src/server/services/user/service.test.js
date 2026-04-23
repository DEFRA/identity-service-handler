import { afterEach, describe, expect, test, vi } from 'vitest'
import helperClient from '../../clients/helperClient.js'
import {
  getUserDetails,
  getUserCphs,
  getUserDelegates,
  getUserDelegatedCphsByDelegatingUser
} from './service.js'

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

  describe('getUserDelegates()', () => {
    test('it returns a paginated list of delegates for the given user', async () => {
      // Arrange
      const page = {
        items: [{ id: 'u1', email: 'joe@example.gov.uk' }],
        total_count: 1,
        total_pages: 1,
        page_number: 1,
        page_size: 5
      }
      mocks.helperClientGet.mockResolvedValue({ payload: page })

      // Act
      const result = await getUserDelegates('user-1')

      // Assert
      expect(result).toEqual(page)
      expect(mocks.helperClientGet).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1/delegates')
      )
    })
  })

  describe('getUserDelegatedCphsByDelegatingUser()', () => {
    test('it returns paginated CPH delegations for a delegate filtered by delegating user', async () => {
      // Arrange
      const page = {
        items: [
          {
            id: 'del-1',
            county_parish_holding_id: 'cph-id-1',
            county_parish_holding_number: '12/345/6789',
            active: true
          }
        ],
        total_count: 1,
        total_pages: 1,
        page_number: 1,
        page_size: 5
      }
      mocks.helperClientGet.mockResolvedValue({ payload: page })

      // Act
      const result = await getUserDelegatedCphsByDelegatingUser(
        'delegate-user-id',
        'delegating-user-id'
      )

      // Assert
      expect(result).toEqual(page)
      expect(mocks.helperClientGet).toHaveBeenCalledWith(
        expect.stringContaining(
          '/users/delegate-user-id/delegations/by-cph-owner/delegating-user-id'
        )
      )
    })
  })
})
