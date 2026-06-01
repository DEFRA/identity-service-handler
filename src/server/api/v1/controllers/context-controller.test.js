import { beforeEach, describe, expect, test, vi } from 'vitest'
import { contextController } from './context-controller.js'
import { getUserProfile } from '../../../services/user.js'

vi.mock('../../../services/user.js')

const mocks = {
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

  test('it fetches and returns context', async () => {
    // Arrange
    const profile = makeProfile()
    mocks.getUserProfile.mockResolvedValue(profile)
    const h = makeH()

    // Act
    const result = await contextController.handler(makeRequest(), h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('broker-sub-123')
    expect(h.response).toHaveBeenCalledWith({
      sub: 'broker-sub-123',
      email: 'user@example.com',
      given_name: 'Test',
      family_name: 'User',
      display_name: 'Test User',
      primary_cph: [],
      delegated_cph: []
    })
    expect(h.code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('it passes undefined sub when auth credentials are missing', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile(undefined))
    const h = makeH()

    // Act
    await contextController.handler({}, h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith(undefined)
  })
})
