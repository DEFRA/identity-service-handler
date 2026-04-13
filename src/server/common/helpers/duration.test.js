import { describe, test, expect, vi } from 'vitest'
import { unixEpoch } from './duration.js'

describe('unixEpoch()', () => {
  test('returns current time as Unix seconds', () => {
    // Arrange
    const now = 1700000000000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    // Act
    const result = unixEpoch()

    // Assert
    expect(result).toBe(1700000000)
    vi.restoreAllMocks()
  })

  test('rounds to nearest second', () => {
    // Arrange
    vi.spyOn(Date, 'now').mockReturnValue(1700000000500)

    // Act
    const result = unixEpoch()

    // Assert
    expect(result).toBe(1700000001)
    vi.restoreAllMocks()
  })
})
