import { beforeEach, describe, expect, test, vi } from 'vitest'

import { listController } from './list-controller.js'

const mocks = {
  getUserDelegates: vi.fn(),
  view: vi.fn(),
  redirect: vi.fn()
}

describe('listController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it renders first page when no page query is provided', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    const pageResult = {
      page_number: 1,
      items: [
        {
          id: 'user-1',
          email: 'joe@example.gov.uk',
          display_name: 'Joe Bloggs'
        }
      ],
      total_pages: 1,
      total_count: 1
    }
    mocks.getUserDelegates.mockResolvedValue(pageResult)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: {},
      path: '/delegation'
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await listController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserDelegates).toHaveBeenCalledWith('user-123', { page: 1 })
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pageTitle: 'Manage people who can act for you',
        heading: 'Manage people who can act for you',
        delegates: pageResult.items,
        showingDelegatesCount: 1,
        totalDelegatesCount: 1,
        pagination: null
      })
    )
    expect(result).toBe('view-response')
  })

  test('it renders the requested page and pagination links', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    const pageResult = {
      page_number: 2,
      items: [
        { id: 'user-6', email: 'a@example.gov.uk', display_name: 'A Another' }
      ],
      total_pages: 3,
      total_count: 11
    }
    mocks.getUserDelegates.mockResolvedValue(pageResult)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '2' },
      path: '/delegation'
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    await listController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserDelegates).toHaveBeenCalledWith('user-123', { page: 2 })
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        delegates: pageResult.items,
        showingDelegatesCount: 1,
        totalDelegatesCount: 11,
        pagination: expect.objectContaining({
          items: [
            { number: 1, href: '/delegation?page=1', current: false },
            { number: 2, href: '/delegation?page=2', current: true },
            { number: 3, href: '/delegation?page=3', current: false }
          ],
          previous: { labelText: 'Previous', href: '/delegation?page=1' },
          next: { labelText: 'Next', href: '/delegation?page=3' }
        })
      })
    )
  })

  test('it renders first page with no previous link when there are multiple pages', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    mocks.getUserDelegates.mockResolvedValue({
      page_number: 1,
      items: [{ id: '1', email: 'a@example.gov.uk', display_name: 'A' }],
      total_pages: 2,
      total_count: 6
    })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '1' },
      path: '/delegation'
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    await listController(userService).handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pagination: expect.objectContaining({
          previous: null,
          next: { labelText: 'Next', href: '/delegation?page=2' }
        })
      })
    )
  })

  test('it renders last page with no next link when there are multiple pages', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    mocks.getUserDelegates.mockResolvedValue({
      page_number: 2,
      items: [{ id: '6', email: 'f@example.gov.uk', display_name: 'F' }],
      total_pages: 2,
      total_count: 6
    })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '2' },
      path: '/delegation'
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    await listController(userService).handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pagination: expect.objectContaining({
          previous: { labelText: 'Previous', href: '/delegation?page=1' },
          next: null
        })
      })
    )
  })

  test('it redirects to the current path when page query is invalid', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: 'abc' },
      path: '/delegation'
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await listController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserDelegates).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to the current path when requested page exceeds total pages', async () => {
    // Arrange
    const userService = { getUserDelegates: mocks.getUserDelegates }
    mocks.getUserDelegates.mockResolvedValue({
      page_number: 3,
      items: [],
      total_pages: 3,
      total_count: 15
    })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '999' },
      path: '/delegation'
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await listController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserDelegates).toHaveBeenCalledWith('user-123', {
      page: 999
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})
