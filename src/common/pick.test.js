import { describe, test, expect } from 'vitest'
import { pick } from './pick.js'

describe('pick()', () => {
  test('it returns an object with only the specified keys', () => {
    // Arrange
    const obj = { a: 1, b: 2, c: 3 }

    // Act
    const result = pick(obj, 'a', 'c')

    // Assert
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test('it omits keys not present in the object', () => {
    // Arrange
    const obj = { a: 1 }

    // Act
    const result = pick(obj, 'a', 'missing')

    // Assert
    expect(result).toEqual({ a: 1 })
  })

  test('it returns an empty object when no keys match', () => {
    // Arrange
    const obj = { a: 1, b: 2 }

    // Act
    const result = pick(obj, 'x', 'y')

    // Assert
    expect(result).toEqual({})
  })

  test('it returns an empty object when no keys are given', () => {
    // Arrange
    const obj = { a: 1, b: 2 }

    // Act
    const result = pick(obj)

    // Assert
    expect(result).toEqual({})
  })

  test('it preserves falsy values', () => {
    // Arrange
    const obj = { a: 0, b: false, c: null, d: '' }

    // Act
    const result = pick(obj, 'a', 'b', 'c', 'd')

    // Assert
    expect(result).toEqual({ a: 0, b: false, c: null, d: '' })
  })
})
