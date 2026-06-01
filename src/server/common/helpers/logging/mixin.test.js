import { describe, test, expect, vi } from 'vitest'

vi.mock('@defra/hapi-tracing', () => ({ getTraceId: vi.fn() }))

import { getTraceId } from '@defra/hapi-tracing'
import { mixin } from './mixin.js'

describe('mixin()', () => {
  test('includes trace id when one is present', () => {
    // Arrange
    getTraceId.mockReturnValue('abc-123')

    // Act
    const result = mixin()

    // Assert
    expect(result).toEqual({ trace: { id: 'abc-123' } })
  })

  test('returns empty object when no trace id is present', () => {
    // Arrange
    getTraceId.mockReturnValue(null)

    // Act
    const result = mixin()

    // Assert
    expect(result).toEqual({})
  })
})
