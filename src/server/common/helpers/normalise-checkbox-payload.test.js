import { describe, expect, test } from 'vitest'
import { normaliseCheckboxPayload } from './normalise-checkbox-payload.js'

describe('normaliseCheckboxPayload()', () => {
  test('it returns the value unchanged when the payload is already an array', () => {
    // Arrange
    const value = ['sheep', 'cattle']

    // Act
    const result = normaliseCheckboxPayload(value)

    // Assert
    expect(result).toBe(value)
  })

  test('it wraps a string payload in an array', () => {
    // Arrange
    const value = 'sheep'

    // Act
    const result = normaliseCheckboxPayload(value)

    // Assert
    expect(result).toEqual(['sheep'])
  })

  test('it returns an empty array for unsupported payload values', () => {
    // Arrange
    const value = undefined

    // Act
    const result = normaliseCheckboxPayload(value)

    // Assert
    expect(result).toEqual([])
  })
})
