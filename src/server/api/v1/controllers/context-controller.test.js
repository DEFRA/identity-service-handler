import { beforeEach, describe, expect, test, vi } from 'vitest'

import { contextController } from './context-controller.js'
import { UserService } from '../../../services/user/UserService.js'

const { mockGetUserContext } = vi.hoisted(() => ({
  mockGetUserContext: vi.fn()
}))

vi.mock('../../../services/user/UserService.js', () => ({
  UserService: vi.fn(function MockUserService() {
    return {
      getUserContext: mockGetUserContext
    }
  })
}))

describe('#contextController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should return user context with status code 200', () => {
    const userContext = { sub: 'broker-sub-123', role: 'owner' }
    const request = { user: { sub: 'broker-sub-123' } }
    const code = vi.fn().mockReturnValue('final-response')
    const response = vi.fn().mockReturnValue({ code })
    const h = { response }

    mockGetUserContext.mockReturnValue(userContext)

    const result = contextController.handler(request, h)

    expect(UserService).toHaveBeenCalledTimes(1)
    expect(mockGetUserContext).toHaveBeenCalledWith(request.user)
    expect(response).toHaveBeenCalledWith(userContext)
    expect(code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('Should pass undefined user to the service when request.user is missing', () => {
    const request = {}
    const code = vi.fn().mockReturnValue('final-response')
    const response = vi.fn().mockReturnValue({ code })
    const h = { response }

    mockGetUserContext.mockReturnValue(undefined)

    contextController.handler(request, h)

    expect(mockGetUserContext).toHaveBeenCalledWith(undefined)
    expect(response).toHaveBeenCalledWith(undefined)
    expect(code).toHaveBeenCalledWith(200)
  })
})
