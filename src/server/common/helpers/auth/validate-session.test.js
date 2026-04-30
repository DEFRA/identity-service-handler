import { describe, test, expect } from 'vitest'
import { validateSession } from './validate-session.js'

describe('validateSession()', () => {
  test('it returns isValid false when session has no sub', () => {
    // Arrange
    const req = {}
    const session = {}

    // Act
    const result = validateSession(req, session)

    // Assert
    expect(result).toEqual({ isValid: false })
  })

  test('it returns isValid true with credentials when session has a sub', () => {
    // Arrange
    const req = {}
    const session = { sub: 'user-1', upstreamIdTokenHint: 'upstream-id-token' }

    // Act
    const result = validateSession(req, session)

    // Assert
    expect(result).toEqual({
      isValid: true,
      credentials: {
        sub: 'user-1',
        upstreamIdTokenHint: 'upstream-id-token'
      }
    })
  })
})
