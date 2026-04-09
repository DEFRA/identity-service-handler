import { describe, test, expect } from 'vitest'
import { isNonEmptyArray } from './array-utils.js'

describe('isNonEmptyArray()', () => {
  test('it returns true for a non-empty array', () => {
    expect(isNonEmptyArray(['a', 'b'])).toBe(true)
  })

  test('it returns false for an empty array', () => {
    expect(isNonEmptyArray([])).toBe(false)
  })

  test('it returns false for null', () => {
    expect(isNonEmptyArray(null)).toBe(false)
  })

  test('it returns false for undefined', () => {
    expect(isNonEmptyArray(undefined)).toBe(false)
  })

  test('it returns false for a string', () => {
    expect(isNonEmptyArray('abc')).toBe(false)
  })
})
