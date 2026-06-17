import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import { listController } from './list-controller.js'
import * as delegation from '../../common/helpers/delegation.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getDelegates: vi.spyOn(delegation, 'getDelegates'),
  view: vi.fn(),
  redirect: vi.fn(),
  response: vi.fn(),
  yarFlash: vi.fn()
}

const makeProfile = (assignmentCount = 2) => ({
  direct_assignments: Array.from({ length: assignmentCount }, (_, i) => ({
    county_parish_holding_id: `cph-${i}`,
    county_parish_holding_number: `12/345/000${i}`
  })),
  outbound_delegations: []
})

describe('listController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUserProfile.mockResolvedValue(makeProfile(2))
    mocks.yarFlash.mockReturnValue([])
  })

  const makeH = () => {
    const takeover = vi.fn().mockReturnValue('takeover-response')
    const code = vi.fn().mockReturnValue({ takeover })
    mocks.response.mockReturnValue({ code })
    return {
      view: mocks.view,
      redirect: mocks.redirect,
      response: mocks.response,
      _takeover: takeover,
      _code: code
    }
  }

  test('it renders first page when no page query is provided', async () => {
    // Arrange
    const delegates = [{ id: 'user-1', email: 'joe@example.gov.uk' }]
    mocks.getDelegates.mockReturnValue(delegates)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: {},
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    const result = await listController.handler(request, h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pageTitle: 'Manage people who can act for you',
        heading: 'Manage people who can act for you',
        delegates,
        showingDelegatesCount: 1,
        totalDelegatesCount: 1,
        cphCount: 2,
        pagination: null
      })
    )
    expect(result).toBe('view-response')
  })

  test('it renders the requested page and pagination links', async () => {
    // Arrange
    const allDelegates = Array.from({ length: 11 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${String(i + 1).padStart(2, '0')}@example.gov.uk`
    }))
    mocks.getDelegates.mockReturnValue(allDelegates)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '2' },
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    await listController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        showingDelegatesCount: 5,
        totalDelegatesCount: 11,
        pagination: expect.objectContaining({
          items: [
            { number: 1, href: '/account/delegations?page=1', current: false },
            { number: 2, href: '/account/delegations?page=2', current: true },
            { number: 3, href: '/account/delegations?page=3', current: false }
          ],
          previous: {
            labelText: 'Previous',
            href: '/account/delegations?page=1'
          },
          next: { labelText: 'Next', href: '/account/delegations?page=3' }
        })
      })
    )
  })

  test('it renders first page with no previous link when there are multiple pages', async () => {
    // Arrange
    mocks.getDelegates.mockReturnValue(
      Array.from({ length: 6 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.gov.uk`
      }))
    )
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '1' },
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    await listController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pagination: expect.objectContaining({
          previous: null,
          next: { labelText: 'Next', href: '/account/delegations?page=2' }
        })
      })
    )
  })

  test('it renders last page with no next link when there are multiple pages', async () => {
    // Arrange
    mocks.getDelegates.mockReturnValue(
      Array.from({ length: 6 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.gov.uk`
      }))
    )
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '2' },
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    await listController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        pagination: expect.objectContaining({
          previous: {
            labelText: 'Previous',
            href: '/account/delegations?page=1'
          },
          next: null
        })
      })
    )
  })

  test('it redirects to the current path when page query is invalid', async () => {
    // Arrange
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: 'abc' },
      path: '/account/delegations'
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = makeH()

    // Act
    const result = await listController.handler(request, h)

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/account/delegations')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to the current path when requested page exceeds total pages', async () => {
    // Arrange
    mocks.getDelegates.mockReturnValue(
      Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.gov.uk`
      }))
    )
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: { page: '999' },
      path: '/account/delegations'
    }
    const h = makeH()

    // Act
    const result = await listController.handler(request, h)

    // Assert
    expect(mocks.getDelegates).toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/account/delegations')
    expect(result).toBe('redirect-response')
  })

  test('it renders the page with empty delegates when user has no CPH assignments', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile(0))
    mocks.getDelegates.mockReturnValue([])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: {},
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    const result = await listController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({
        delegates: [],
        totalDelegatesCount: 0,
        cphCount: 0
      })
    )
    expect(result).toBe('view-response')
  })

  test('it passes singleCph true when user has exactly one CPH', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile(1))
    mocks.getDelegates.mockReturnValue([
      { id: 'user-1', email: 'a@example.gov.uk' }
    ])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: {},
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    await listController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({ cphCount: 1 })
    )
  })

  test('it sorts delegates by createdAt descending', async () => {
    // Arrange
    const older = {
      id: 'user-1',
      email: 'a@example.gov.uk',
      createdAt: new Date('2024-01-01')
    }
    const newer = {
      id: 'user-2',
      email: 'b@example.gov.uk',
      createdAt: new Date('2024-06-01')
    }
    mocks.getDelegates.mockReturnValue([older, newer])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      query: {},
      path: '/account/delegations',
      yar: { flash: mocks.yarFlash }
    }
    const h = makeH()

    // Act
    let result, error
    try {
      result = await listController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/index',
      expect.objectContaining({ delegates: [newer, older] })
    )
    expect(result).toBe('view-response')
  })
})
