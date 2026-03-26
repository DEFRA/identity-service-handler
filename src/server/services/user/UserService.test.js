import { afterEach, describe, expect, test, vi } from 'vitest'
import { UserService } from './UserService.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'
import { config } from '../../../config/config.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  serviceGetUserDetails: vi.spyOn(service, 'getUserDetails'),
  serviceGetUserCphs: vi.spyOn(service, 'getUserCphs'),
  serviceFakeGetUserDetails: vi.spyOn(serviceFake, 'getUserDetails'),
  serviceFakeGetUserCphs: vi.spyOn(serviceFake, 'getUserCphs'),
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
}

describe('UserService', () => {
  const subjectMapping = {
    sub: 'broker-sub',
    email: 'broker-sub'
  }

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getUserContext()', () => {
    test('it returns cached user context when present', async () => {
      // Arrange
      const cached = { sub: 'broker-sub', email: 'broker-sub' }
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(subjectMapping)

      // Assert
      expect(result).toEqual(cached)
      expect(mocks.serviceGetUserDetails).not.toHaveBeenCalled()
      expect(mocks.serviceGetUserCphs).not.toHaveBeenCalled()
    })

    test('it delegates to the real service when useFakeClient is false', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserDetails.mockResolvedValue({
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
      mocks.serviceGetUserCphs.mockResolvedValue({
        primary_cph: [{ cph: '123', role: 'Owner' }],
        delegated_cph: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(subjectMapping)

      // Assert
      expect(mocks.serviceGetUserDetails).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceGetUserCphs).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceFakeGetUserDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'broker-sub',
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        primary_cph: [{ cph: '123', role: 'Owner' }],
        delegated_cph: []
      })
    })

    test('it delegates to the fake service when useFakeClient is true', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: true })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceFakeGetUserDetails.mockResolvedValue({
        display_name: 'Fake User',
        given_name: 'Fake',
        family_name: 'User'
      })
      mocks.serviceFakeGetUserCphs.mockResolvedValue({
        primary_cph: [],
        delegated_cph: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      const result = await userService.getUserContext(subjectMapping)

      // Assert
      expect(mocks.serviceFakeGetUserDetails).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceFakeGetUserCphs).toHaveBeenCalledWith('broker-sub')
      expect(mocks.serviceGetUserDetails).not.toHaveBeenCalled()
      expect(result).toEqual({
        sub: 'broker-sub',
        email: 'broker-sub',
        display_name: 'Fake User',
        given_name: 'Fake',
        family_name: 'User',
        primary_cph: [],
        delegated_cph: []
      })
    })

    test('it caches the built user context', async () => {
      // Arrange
      mocks.configGet.mockReturnValue({ useFakeClient: false })
      mocks.redis.get.mockResolvedValue(undefined)
      mocks.redis.set.mockResolvedValue('OK')
      mocks.serviceGetUserDetails.mockResolvedValue({
        display_name: 'Test User',
        given_name: 'Test',
        family_name: 'User'
      })
      mocks.serviceGetUserCphs.mockResolvedValue({
        primary_cph: [{ cph: '123', role: 'Owner' }],
        delegated_cph: []
      })
      const userService = new UserService(mocks.redis, config)

      // Act
      await userService.getUserContext(subjectMapping)

      // Assert
      expect(mocks.redis.set).toHaveBeenCalledWith(
        'userContext:broker-sub',
        JSON.stringify({
          sub: 'broker-sub',
          email: 'broker-sub',
          display_name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
          primary_cph: [{ cph: '123', role: 'Owner' }],
          delegated_cph: []
        }),
        'EX',
        300
      )
    })
  })
})
