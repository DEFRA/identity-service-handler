import { describe, expect, test } from 'vitest'
import { dump } from './debug-funcs.js'

describe('dump()', () => {
  test('it returns a pretty-printed JSON string of the value', () => {
    // Arrange
    const value = { foo: 'bar', count: 42 }

    // Act
    const result = dump(value)

    // Assert
    expect(result).toBe(JSON.stringify(value, null, 2))
  })
})
