import { afterEach, describe, expect, test, vi } from 'vitest'
import { UserService } from './UserService.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'
import { config } from '../../../config/config.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  serviceGetUserProfile: vi.spyOn(service, 'getUserProfile'),
  serviceFakeGetUserProfile: vi.spyOn(serviceFake, 'getUserProfile'),
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
      expect(mocks.serviceGetUserProfile).not.toHaveBeenCalled()
    })

    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserProfile.mockResolvedValue({
        user_details: {
          email: 'user@example.com',
          display_name: 'Test User',
          first_name: 'Test',
          last_name: 'User'
        },
        direct_assignments: [{ county_parish_holding_number: '123' }],
        inbound_delegations: [],
        outbound_delegations: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(mocks.serviceGetUserProfile).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceFakeGetUserProfile).not.toHaveBeenCalled()
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
      mocks.serviceFakeGetUserProfile.mockResolvedValue({
        user_details: {
          email: 'fake@example.com',
          display_name: 'Fake User',
          first_name: 'Fake',
          last_name: 'User'
        },
        direct_assignments: [],
        inbound_delegations: [],
        outbound_delegations: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(sub)

      // Assert
      expect(mocks.serviceFakeGetUserProfile).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceGetUserProfile).not.toHaveBeenCalled()
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
      mocks.serviceGetUserProfile.mockResolvedValue({
        user_details: {
          email: 'user@example.com',
          display_name: 'Test User',
          first_name: 'Test',
          last_name: 'User'
        },
        direct_assignments: [],
        inbound_delegations: [
          {
            county_parish_holding_number: '111',
            expires_at: new Date(future).toISOString()
          },
          {
            county_parish_holding_number: '222',
            expires_at: new Date(past).toISOString()
          },
          {
            county_parish_holding_number: '333'
          }
        ],
        outbound_delegations: []
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
      mocks.serviceGetUserProfile.mockResolvedValue({
        user_details: {
          email: 'user@example.com',
          display_name: 'Test User',
          first_name: 'Test',
          last_name: 'User'
        },
        direct_assignments: [{ county_parish_holding_number: '123' }],
        inbound_delegations: [],
        outbound_delegations: []
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

  describe('getUserProfile()', () => {
    const profile = {
      user_details: {
        id: 'user-1',
        email: 'user@example.gov.uk',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'Test User'
      },
      direct_assignments: [{ county_parish_holding_number: '12/345/6789' }],
      inbound_delegations: [],
      outbound_delegations: []
    }

    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserProfile.mockResolvedValue(profile)
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserProfile('user-1')

      // Assert
      expect(mocks.serviceGetUserProfile).toHaveBeenCalledWith('user-1')
      expect(mocks.serviceFakeGetUserProfile).not.toHaveBeenCalled()
      expect(result).toEqual(profile)
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.serviceFakeGetUserProfile.mockResolvedValue(profile)
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserProfile('user-1')

      // Assert
      expect(mocks.serviceFakeGetUserProfile).toHaveBeenCalledWith('user-1')
      expect(mocks.serviceGetUserProfile).not.toHaveBeenCalled()
      expect(result).toEqual(profile)
    })
  })

  describe('getUserCphs()', () => {
    test('it returns assignments from the user profile', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserProfile.mockResolvedValue({
        user_details: {},
        direct_assignments: [
          { county_parish_holding_number: '12/345/6789' },
          { county_parish_holding_number: '98/765/4321' }
        ],
        inbound_delegations: [],
        outbound_delegations: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserCphs('user-1')

      // Assert
      expect(mocks.serviceGetUserProfile).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({
        assignments: [
          { county_parish_holding_number: '12/345/6789' },
          { county_parish_holding_number: '98/765/4321' }
        ]
      })
    })

    test('it returns an empty assignments array when the user has no direct assignments', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.serviceGetUserProfile.mockResolvedValue({
        user_details: {},
        direct_assignments: [],
        inbound_delegations: [],
        outbound_delegations: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserCphs('user-1')

      // Assert
      expect(result).toEqual({ assignments: [] })
    })
  })
})
