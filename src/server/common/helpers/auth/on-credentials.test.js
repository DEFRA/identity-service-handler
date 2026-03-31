import { describe, test, expect, vi, afterEach } from 'vitest'
import * as requestContext from '../request-context.js'
import { onCredentials } from './on-credentials.js'

vi.mock('../request-context.js')

const mocks = {
  set: vi.mocked(requestContext.set),
  continue: Symbol('continue')
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('onCredentials()', () => {
  test('it sets operator_id when request is authenticated', () => {
    // Arrange
    const request = {
      auth: { isAuthenticated: true, credentials: { sub: 'user-1' } }
    }
    const h = { continue: mocks.continue }

    // Act
    const result = onCredentials(request, h)

    // Assert
    expect(mocks.set).toHaveBeenCalledWith('operator_id', 'user-1')
    expect(result).toBe(mocks.continue)
  })

  test('it does not set operator_id when request is not authenticated', () => {
    // Arrange
    const request = { auth: { isAuthenticated: false } }
    const h = { continue: mocks.continue }

    // Act
    const result = onCredentials(request, h)

    // Assert
    expect(mocks.set).not.toHaveBeenCalled()
    expect(result).toBe(mocks.continue)
  })
})
