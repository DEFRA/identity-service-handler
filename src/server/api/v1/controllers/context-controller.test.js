import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../services/user/index.js', () => ({
  default: { getUserProfile: vi.fn() }
}))

import userService from '../../../services/user/index.js'
import { contextController } from './context-controller.js'

const mocks = {
  redis: {
    get: vi.fn(),
    set: vi.fn()
  }
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
    vi.clearAllMocks()
  })

  test('it returns cached context when present', async () => {
    // Arrange
    const cached = { sub: 'broker-sub-123', email: 'user@example.com' }
    mocks.redis.get.mockResolvedValue(JSON.stringify(cached))
    const h = makeH()

    // Act
    const result = await contextController(mocks.redis).handler(
      makeRequest(),
      h
    )

    // Assert
    expect(mocks.redis.get).toHaveBeenCalledWith('user_context:broker-sub-123')
    expect(userService.getUserProfile).not.toHaveBeenCalled()
    expect(h.response).toHaveBeenCalledWith(cached)
    expect(h.code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('it fetches, caches, and returns context on a cache miss', async () => {
    // Arrange
    const profile = makeProfile()
    mocks.redis.get.mockResolvedValue(null)
    mocks.redis.set.mockResolvedValue('OK')
    userService.getUserProfile.mockResolvedValue(profile)
    const h = makeH()

    // Act
    const result = await contextController(mocks.redis).handler(
      makeRequest(),
      h
    )

    // Assert
    expect(userService.getUserProfile).toHaveBeenCalledWith('broker-sub-123')
    const expectedContext = {
      sub: 'broker-sub-123',
      email: 'user@example.com',
      given_name: 'Test',
      family_name: 'User',
      display_name: 'Test User',
      primary_cph: [],
      delegated_cph: []
    }
    expect(mocks.redis.set).toHaveBeenCalledWith(
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
    mocks.redis.get.mockResolvedValue(null)
    mocks.redis.set.mockResolvedValue('OK')
    userService.getUserProfile.mockResolvedValue(makeProfile(undefined))
    const h = makeH()

    // Act
    await contextController(mocks.redis).handler({}, h)

    // Assert
    expect(mocks.redis.get).toHaveBeenCalledWith('user_context:undefined')
    expect(userService.getUserProfile).toHaveBeenCalledWith(undefined)
  })
})
