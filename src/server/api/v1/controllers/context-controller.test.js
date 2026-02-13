import { beforeEach, describe, expect, test, vi } from 'vitest'

import { contextController } from './context-controller.js'

const mockGetUserContext = vi.fn()

describe('#contextController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should return user context with status code 200', async () => {
    const userContext = { sub: 'broker-sub-123', role: 'owner' }
    const request = { auth: { credentials: { sub: 'broker-sub-123' } } }
    const code = vi.fn().mockReturnValue('final-response')
    const response = vi.fn().mockReturnValue({ code })
    const h = { response }
    const userService = { getUserContext: mockGetUserContext }

    mockGetUserContext.mockResolvedValue(userContext)

    const result = await contextController(userService).handler(request, h)

    expect(mockGetUserContext).toHaveBeenCalledWith(request, 'broker-sub-123')
    expect(response).toHaveBeenCalledWith(userContext)
    expect(code).toHaveBeenCalledWith(200)
    expect(result).toBe('final-response')
  })

  test('Should pass undefined sub to the service when auth credentials are missing', async () => {
    const request = {}
    const code = vi.fn().mockReturnValue('final-response')
    const response = vi.fn().mockReturnValue({ code })
    const h = { response }
    const userService = { getUserContext: mockGetUserContext }

    mockGetUserContext.mockResolvedValue(undefined)

    await contextController(userService).handler(request, h)

    expect(mockGetUserContext).toHaveBeenCalledWith(request, undefined)
    expect(response).toHaveBeenCalledWith(undefined)
    expect(code).toHaveBeenCalledWith(200)
  })
})
