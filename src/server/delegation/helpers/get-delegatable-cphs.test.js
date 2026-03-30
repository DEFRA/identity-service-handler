import { describe, expect, test } from 'vitest'
import { getDelegatableCphs } from './get-delegatable-cphs.js'

describe('getDelegatableCphs()', () => {
  test('it returns CPHs where role is Owner', () => {
    // Arrange
    const userContext = {
      primary_cph: [
        { cph: '12/345/6789', role: 'Owner' },
        { cph: '35/345/0005', role: 'Sole Occupier' }
      ]
    }

    // Act
    const result = getDelegatableCphs(userContext)

    // Assert
    expect(result).toEqual(['12/345/6789'])
  })

  test('it returns an empty array when there are no primary CPHs', () => {
    // Arrange
    const userContext = { primary_cph: [] }

    // Act
    const result = getDelegatableCphs(userContext)

    // Assert
    expect(result).toEqual([])
  })

  test('it returns an empty array when primary_cph is undefined', () => {
    // Arrange
    const userContext = {}

    // Act
    const result = getDelegatableCphs(userContext)

    // Assert
    expect(result).toEqual([])
  })
})
