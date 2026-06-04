import { describe, expect, test } from 'vitest'
import {
  buildPagination,
  buildPaginationSearchParams,
  paginateList
} from './pagination.js'

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

describe('paginateList()', () => {
  const list = ['a', 'b', 'c', 'd', 'e']

  test('it returns the first page of results', () => {
    const result = paginateList(list, { page: 1, pageSize: 2 })

    expect(result).toEqual({
      items: ['a', 'b'],
      total_count: 5,
      total_pages: 3,
      page_number: 1,
      page_size: 2
    })
  })

  test('it returns a subsequent page', () => {
    const result = paginateList(list, { page: 2, pageSize: 2 })

    expect(result).toEqual({
      items: ['c', 'd'],
      total_count: 5,
      total_pages: 3,
      page_number: 2,
      page_size: 2
    })
  })

  test('it returns at least 1 total page for an empty list', () => {
    const result = paginateList([], { page: 1, pageSize: 10 })

    expect(result.total_pages).toBe(1)
    expect(result.items).toEqual([])
    expect(result.total_count).toBe(0)
  })

  test('it defaults to page 1 and pageSize 5', () => {
    const result = paginateList(list)

    expect(result.page_number).toBe(1)
    expect(result.page_size).toBe(5)
    expect(result.items).toEqual(list)
  })
})

describe('buildPagination()', () => {
  test('it returns null when there is only one page', () => {
    expect(buildPagination(1, 1, '/example')).toBeNull()
  })

  test('it returns page items with hrefs for each page', () => {
    const result = buildPagination(2, 3, '/example')

    expect(result.items).toEqual([
      { number: 1, href: '/example?page=1', current: false },
      { number: 2, href: '/example?page=2', current: true },
      { number: 3, href: '/example?page=3', current: false }
    ])
  })

  test('it returns previous and next links for a middle page', () => {
    const result = buildPagination(2, 3, '/example')

    expect(result.previous).toEqual({
      labelText: 'Previous',
      href: '/example?page=1'
    })
    expect(result.next).toEqual({ labelText: 'Next', href: '/example?page=3' })
  })

  test('it returns no previous link on the first page', () => {
    const result = buildPagination(1, 3, '/example')

    expect(result.previous).toBeNull()
    expect(result.next).toEqual({ labelText: 'Next', href: '/example?page=2' })
  })

  test('it returns no next link on the last page', () => {
    const result = buildPagination(3, 3, '/example')

    expect(result.previous).toEqual({
      labelText: 'Previous',
      href: '/example?page=2'
    })
    expect(result.next).toBeNull()
  })
})
