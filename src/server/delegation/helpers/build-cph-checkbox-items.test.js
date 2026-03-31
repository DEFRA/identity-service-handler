import { describe, expect, test } from 'vitest'
import { buildCphCheckboxItems } from './build-cph-checkbox-items.js'

describe('buildCphCheckboxItems()', () => {
  test('it marks selected CPHs as checked', () => {
    // Arrange
    const availableCphs = ['12/345/6789', '35/345/0005']
    const selectedCphs = ['12/345/6789']

    // Act
    const result = buildCphCheckboxItems(availableCphs, selectedCphs)

    // Assert
    expect(result).toEqual([
      {
        value: '12/345/6789',
        text: 'County Parish Holding Number 12/345/6789',
        checked: true
      },
      {
        value: '35/345/0005',
        text: 'County Parish Holding Number 35/345/0005',
        checked: false
      }
    ])
  })

  test('it returns all unchecked when nothing is selected', () => {
    // Arrange
    const availableCphs = ['12/345/6789', '35/345/0005']

    // Act
    const result = buildCphCheckboxItems(availableCphs, [])

    // Assert
    expect(result.every((item) => item.checked === false)).toBe(true)
  })

  test('it returns an empty array when there are no available CPHs', () => {
    // Act
    const result = buildCphCheckboxItems([], ['12/345/6789'])

    // Assert
    expect(result).toEqual([])
  })
})
