import { describe, expect, test } from 'vitest'
import { buildCphCheckboxItems } from './build-cph-checkbox-items.js'

describe('buildCphCheckboxItems()', () => {
  test('it marks selected CPHs as checked', () => {
    // Arrange
    const availableCphs = new Map([
      ['cph-id-1', '12/345/6789'],
      ['cph-id-2', '35/345/0005']
    ])
    const selectedCphs = new Set(['cph-id-1'])

    // Act
    const result = buildCphCheckboxItems(availableCphs, selectedCphs)

    // Assert
    expect(result).toEqual([
      {
        value: 'cph-id-1',
        text: 'County Parish Holding Number 12/345/6789',
        checked: true
      },
      {
        value: 'cph-id-2',
        text: 'County Parish Holding Number 35/345/0005',
        checked: false
      }
    ])
  })

  test('it returns all unchecked when nothing is selected', () => {
    // Arrange
    const availableCphs = new Map([
      ['cph-id-1', '12/345/6789'],
      ['cph-id-2', '35/345/0005']
    ])

    // Act
    const result = buildCphCheckboxItems(availableCphs, new Set())

    // Assert
    expect(result.every((item) => item.checked === false)).toBe(true)
  })

  test('it returns an empty array when there are no available CPHs', () => {
    // Act
    const result = buildCphCheckboxItems(new Map(), new Set(['cph-id-1']))

    // Assert
    expect(result).toEqual([])
  })
})
