import { afterEach, describe, expect, test, vi } from 'vitest'
import { UserService } from './UserService.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'
import { config } from '../../../config/config.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  serviceGetUserDetails: vi.spyOn(service, 'getUserDetails'),
  serviceGetUserCphs: vi.spyOn(service, 'getUserCphs'),
  serviceGetUserDelegates: vi.spyOn(service, 'getUserDelegates'),
  serviceGetUserDelegatedCphsByDelegatingUser: vi.spyOn(
    service,
    'getUserDelegatedCphsByDelegatingUser'
  ),
  serviceFakeGetUserDetails: vi.spyOn(serviceFake, 'getUserDetails'),
  serviceFakeGetUserCphs: vi.spyOn(serviceFake, 'getUserCphs'),
  serviceFakeGetUserDelegates: vi.spyOn(serviceFake, 'getUserDelegates'),
  serviceFakeGetUserDelegatedCphsByDelegatingUser: vi.spyOn(
    serviceFake,
    'getUserDelegatedCphsByDelegatingUser'
  ),
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}

describe('UserService', () => {
  const sub = 'broker-sub'

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getUserContext()', () => {
    test('it returns cached user context when present', async () => {
      // Arrange
      const cached = {
        sub: 'broker-sub',
        email: 'user@example.com',
        primary_cph: [],
        delegated_cph: []
      }
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(result).toEqual(cached)
      expect(mocks.redis.get).toHaveBeenCalledWith('user_context:broker-sub')
      expect(mocks.serviceGetUserDetails).not.toHaveBeenCalled()
      expect(mocks.serviceGetUserCphs).not.toHaveBeenCalled()
    })

    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'user@example.com',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User'
      })
      mocks.serviceGetUserCphs.mockResolvedValue({
        assignments: [
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
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(mocks.serviceGetUserDetails).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceGetUserCphs).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceFakeGetUserDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'user@example.com',
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        primary_cph: [{ cph: '123', expires: null }],
        delegated_cph: []
      })
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceFakeGetUserDetails.mockResolvedValue({
        email: 'fake@example.com',
        display_name: 'Fake User',
        first_name: 'Fake',
        last_name: 'User'
      })
      mocks.serviceFakeGetUserCphs.mockResolvedValue({
        assignments: [],
        delegations: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(mocks.serviceFakeGetUserDetails).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceFakeGetUserCphs).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceGetUserDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'fake@example.com',
        display_name: 'Fake User',
        given_name: 'Fake',
        family_name: 'User',
        primary_cph: [],
        delegated_cph: []
      })
    })

    test('it filters out expired delegated cphs', async () => {
      // Arrange
      const future = Date.now() + 100000
      const past = Date.now() - 100000
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'user@example.com',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User'
      })
      mocks.serviceGetUserCphs.mockResolvedValue({
        assignments: [],
        delegations: [
          {
            county_parish_holding_number: '111',
            delegated_user_role_name: 'Agent',
            expires_at: new Date(future).toISOString()
          },
          {
            county_parish_holding_number: '222',
            delegated_user_role_name: 'Agent',
            expires_at: new Date(past).toISOString()
          },
          {
            county_parish_holding_number: '333',
            delegated_user_role_name: 'Agent'
          }
        ]
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(result.delegated_cph).toEqual([
        { cph: '111', expires: new Date(future).toISOString() },
        { cph: '333', expires: null }
      ])
    })

    test('it caches the built user context', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'user@example.com',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User'
      })
      mocks.serviceGetUserCphs.mockResolvedValue({
        assignments: [
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
      const userService = new UserService(mocks.redis, config)

      // Act
      await userService.getUserContext(sub)

      // Assert
      expect(mocks.redis.set).toHaveBeenCalledWith(
        'user_context:broker-sub',
        JSON.stringify({
          sub: 'broker-sub',
          email: 'user@example.com',
          given_name: 'Test',
          family_name: 'User',
          display_name: 'Test User',
          primary_cph: [{ cph: '123', expires: null }],
          delegated_cph: []
        }),
        'EX',
        300
      )
    })
  })

  describe('getUserDelegates()', () => {
    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      const page = {
        items: [{ id: 'u1', email: 'joe@example.gov.uk' }],
        total_count: 1,
        total_pages: 1,
        page_number: 1,
        page_size: 5
      }
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserDelegates.mockResolvedValue(page)
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserDelegates('user-1', {
        page: 1,
        pageSize: 5
      })

      // Assert
      expect(mocks.serviceGetUserDelegates).toHaveBeenCalledWith('user-1', {
        page: 1,
        pageSize: 5
      })
      expect(result).toEqual(page)
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      const page = {
        items: [],
        total_count: 0,
        total_pages: 0,
        page_number: 1,
        page_size: 10
      }
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.serviceFakeGetUserDelegates.mockResolvedValue(page)
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserDelegates('user-1')

      // Assert
      expect(mocks.serviceFakeGetUserDelegates).toHaveBeenCalledWith(
        'user-1',
        {}
      )
      expect(mocks.serviceGetUserDelegates).not.toHaveBeenCalled()
      expect(result).toEqual(page)
    })
  })

  describe('getUserDelegatedCphsByDelegatingUser()', () => {
    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      const page = {
        items: [
          {
            id: 'del-1',
            county_parish_holding_number: '12/345/6789',
            active: true
          }
        ],
        total_count: 1,
        total_pages: 1,
        page_number: 1,
        page_size: 5
      }
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserDelegatedCphsByDelegatingUser.mockResolvedValue(page)
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserDelegatedCphsByDelegatingUser(
        'delegate-id',
        'owner-id'
      )

      // Assert
      expect(
        mocks.serviceGetUserDelegatedCphsByDelegatingUser
      ).toHaveBeenCalledWith('delegate-id', 'owner-id', {})
      expect(result).toEqual(page)
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      const page = {
        items: [],
        total_count: 0,
        total_pages: 0,
        page_number: 1,
        page_size: 10
      }
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.serviceFakeGetUserDelegatedCphsByDelegatingUser.mockResolvedValue(
        page
      )
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserDelegatedCphsByDelegatingUser(
        'delegate-id',
        'owner-id'
      )

      // Assert
      expect(
        mocks.serviceFakeGetUserDelegatedCphsByDelegatingUser
      ).toHaveBeenCalledWith('delegate-id', 'owner-id', {})
      expect(
        mocks.serviceGetUserDelegatedCphsByDelegatingUser
      ).not.toHaveBeenCalled()
      expect(result).toEqual(page)
    })
  })

  describe('getDelegatedUser()', () => {
    const delegatingUserId = 'delegating-user-1'
    const delegatedUserId = 'delegated-user-2'

    test('it returns merged CPH data when delegations exist from the delegating user', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'joe@example.gov.uk'
      })
      mocks.serviceGetUserCphs
        .mockResolvedValueOnce({
          // delegating user's assignments
          assignments: [
            {
              county_parish_holding_id: 'cph-id-1',
              county_parish_holding_number: '12/345/6789'
            },
            {
              county_parish_holding_id: 'cph-id-2',
              county_parish_holding_number: '35/345/0005'
            }
          ],
          delegations: []
        })
        .mockResolvedValueOnce({
          // delegated user's delegations — one from the delegating user
          assignments: [],
          delegations: [
            {
              county_parish_holding_id: 'cph-id-1',
              delegating_user_id: delegatingUserId,
              id: 'del-abc'
            }
          ]
        })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getDelegatedUser(
        delegatingUserId,
        delegatedUserId
      )

      // Assert
      expect(mocks.serviceGetUserDetails).toHaveBeenCalledWith(delegatedUserId)
      expect(result).toEqual({
        id: delegatedUserId,
        email: 'joe@example.gov.uk',
        cphs: [
          {
            county_parish_holding_id: 'cph-id-1',
            county_parish_holding_number: '12/345/6789',
            delegation_id: 'del-abc'
          },
          {
            county_parish_holding_id: 'cph-id-2',
            county_parish_holding_number: '35/345/0005',
            delegation_id: null
          }
        ]
      })
    })

    test('it returns null when the delegated user has no delegations from this delegating user', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'joe@example.gov.uk'
      })
      mocks.serviceGetUserCphs
        .mockResolvedValueOnce({
          assignments: [
            {
              county_parish_holding_id: 'cph-id-1',
              county_parish_holding_number: '12/345/6789'
            }
          ],
          delegations: []
        })
        .mockResolvedValueOnce({ assignments: [], delegations: [] })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getDelegatedUser(
        delegatingUserId,
        delegatedUserId
      )

      // Assert
      expect(result).toBeNull()
    })

    test('it ignores delegations from other delegating users', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserDetails.mockResolvedValue({
        email: 'joe@example.gov.uk'
      })
      mocks.serviceGetUserCphs
        .mockResolvedValueOnce({
          assignments: [
            {
              county_parish_holding_id: 'cph-id-1',
              county_parish_holding_number: '12/345/6789'
            }
          ],
          delegations: []
        })
        .mockResolvedValueOnce({
          assignments: [],
          delegations: [
            {
              county_parish_holding_id: 'cph-id-1',
              delegating_user_id: 'some-other-user',
              id: 'del-xyz'
            }
          ]
        })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getDelegatedUser(
        delegatingUserId,
        delegatedUserId
      )

      // Assert — delegation from another user should not count
      expect(result).toBeNull()
    })
  })
})
