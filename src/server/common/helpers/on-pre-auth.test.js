import { describe, test, expect, vi, afterEach } from 'vitest'
import * as requestContext from './request-context.js'
import { onPreAuth } from './on-pre-auth.js'

const mocks = {
  set: vi.spyOn(requestContext, 'set').mockImplementation(() => {})
}

const mockH = { continue: Symbol('continue') }

afterEach(() => {
  vi.clearAllMocks()
})

describe('onPreAuth()', () => {
  test('stores correlation id from request header', () => {
    // Arrange
    const request = { headers: { 'x-correlation-id': 'abc-123' } }

    // Act
    const result = onPreAuth(request, mockH)

    // Assert
    expect(mocks.set).toHaveBeenCalledWith('correlation_id', 'abc-123')
    expect(result).toBe(mockH.continue)
  })

  test('generates a UUID correlation id when header is absent', () => {
    // Arrange
    const request = { headers: {} }

    // Act
    const result = onPreAuth(request, mockH)

    // Assert
    expect(mocks.set).toHaveBeenCalledWith(
      'correlation_id',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    )
    expect(result).toBe(mockH.continue)
  })
})
