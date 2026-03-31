import { describe, expect, test } from 'vitest'
import { filterByKeyValue, sort } from './array-funcs.js'

describe('filterByKeyValue()', () => {
  test('it returns items where a scalar field matches the filter value', () => {
    // Arrange
    const items = [
      { id: '1', type: 'cat' },
      { id: '2', type: 'dog' },
      { id: '3', type: 'cat' }
    ]

    // Act
    const result = filterByKeyValue(items, 'type', 'cat')

    // Assert
    expect(result).toEqual([items[0], items[2]])
  })

  test('it returns items where an array field includes the filter value', () => {
    // Arrange
    const items = [
      { id: '1', tags: ['a', 'b'] },
      { id: '2', tags: ['b', 'c'] },
      { id: '3', tags: ['a', 'c'] }
    ]

    // Act
    const result = filterByKeyValue(items, 'tags', 'a')

    // Assert
    expect(result).toEqual([items[0], items[2]])
  })
})

describe('sort()', () => {
  test('it sorts ascending by default', () => {
    // Arrange
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }]

    // Act
    const result = sort(items, 'name')

    // Assert
    expect(result.map((x) => x.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  test('it sorts descending when order is desc', () => {
    // Arrange
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }]

    // Act
    const result = sort(items, 'name', 'desc')

    // Assert
    expect(result.map((x) => x.name)).toEqual(['Charlie', 'Bob', 'Alice'])
  })
})
