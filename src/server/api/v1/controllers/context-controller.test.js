import { beforeEach, describe, expect, test, vi } from 'vitest'
import { contextController } from './context-controller.js'
import { redisClient } from '../../../common/helpers/redis-client.js'
import { getUserProfile } from '../../../services/user.js'

vi.mock('../../../services/user.js')

const mocks = {
  redisClient: {
    get: vi.spyOn(redisClient, 'get'),
    set: vi.spyOn(redisClient, 'set')
  },
  getUserProfile: vi.mocked(getUserProfile)
}

const makeH = () => {
  const code = vi.fn().mockReturnValue('final-response')
  const response = vi.fn().mockReturnValue({ code })
  return { response, code }
}

const makeRequest = (sub = 'broker-sub-123') => ({
  auth: { credentials: { sub } }
})

const makeProfile = (id = 'broker-sub-123') => ({
  user_details: {
    id,
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User'
  },
  direct_assignments: [],
  inbound_delegations: [],
  outbound_delegations: []
})

describe('contextController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it returns cached context when present', async () => {
    // Arrange
    const cached = { sub: 'broker-sub-123', email: 'user@example.com' }
    mocks.redisClient.get.mockResolvedValue(JSON.stringify(cached))
    const h = makeH()

    // Act
    const result = await contextController.handler(makeRequest(), h)

    // Assert
    expect(mocks.redisClient.get).toHaveBeenCalledWith(
      'user_context:broker-sub-123'
    )
    expect(mocks.getUserProfile).not.toHaveBeenCalled()
    expect(h.response).toHaveBeenCalledWith(cached)
    expect(h.code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('it fetches, caches, and returns context on a cache miss', async () => {
    // Arrange
    const profile = makeProfile()
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.redisClient.set.mockResolvedValue('OK')
    mocks.getUserProfile.mockResolvedValue(profile)
    const h = makeH()

    // Act
    const result = await contextController.handler(makeRequest(), h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('broker-sub-123')
    const expectedContext = {
      sub: 'broker-sub-123',
      email: 'user@example.com',
      given_name: 'Test',
      family_name: 'User',
      display_name: 'Test User',
      primary_cph: [],
      delegated_cph: []
    }
    expect(mocks.redisClient.set).toHaveBeenCalledWith(
      'user_context:broker-sub-123',
      JSON.stringify(expectedContext),
      'EX',
      300
    )
    expect(h.response).toHaveBeenCalledWith(expectedContext)
    expect(h.code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('it passes undefined sub when auth credentials are missing', async () => {
    // Arrange
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.redisClient.set.mockResolvedValue('OK')
    mocks.getUserProfile.mockResolvedValue(makeProfile(undefined))
    const h = makeH()

    // Act
    await contextController.handler({}, h)

    // Assert
    expect(mocks.redisClient.get).toHaveBeenCalledWith('user_context:undefined')
    expect(mocks.getUserProfile).toHaveBeenCalledWith(undefined)
  })
})
