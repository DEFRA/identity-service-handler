import { describe, expect, test } from 'vitest'
import { buildPaginationSearchParams } from './pagination.js'

describe('buildPaginationSearchParams()', () => {
  test('it returns default pageSize and pageNumber when called with no options', () => {
    const params = buildPaginationSearchParams()

    expect(params.get('pageSize')).toBe('5')
    expect(params.get('pageNumber')).toBe('1')
  })

  test('it sets the requested page number', () => {
    const params = buildPaginationSearchParams({ page: 3 })

    expect(params.get('pageNumber')).toBe('3')
  })

  test('it sets the requested page size', () => {
    const params = buildPaginationSearchParams({ pageSize: 10 })

    expect(params.get('pageSize')).toBe('10')
  })

  test('it clamps pageSize to the minimum of 1', () => {
    const params = buildPaginationSearchParams({ pageSize: 0 })

    expect(params.get('pageSize')).toBe('1')
  })

  test('it clamps pageSize to the maximum of 50', () => {
    const params = buildPaginationSearchParams({ pageSize: 100 })

    expect(params.get('pageSize')).toBe('50')
  })

  test('it falls back to page 1 when a non-integer page is given', () => {
    const params = buildPaginationSearchParams({ page: 1.5 })

    expect(params.get('pageNumber')).toBe('1')
  })

  test('it falls back to page 1 when page is less than 1', () => {
    const params = buildPaginationSearchParams({ page: 0 })

    expect(params.get('pageNumber')).toBe('1')
  })

  test('it falls back to default page size when pageSize is not an integer', () => {
    const params = buildPaginationSearchParams({ pageSize: 2.5 })

    expect(params.get('pageSize')).toBe('5')
  })

  test('it falls back to default page size when pageSize is NaN', () => {
    const params = buildPaginationSearchParams({ pageSize: NaN })

    expect(params.get('pageSize')).toBe('5')
  })

  test('it returns a URLSearchParams instance', () => {
    const params = buildPaginationSearchParams()

    expect(params).toBeInstanceOf(URLSearchParams)
  })
})
