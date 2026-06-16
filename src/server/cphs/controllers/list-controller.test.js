import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import { listController, buildCphRows } from './list-controller.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  view: vi.fn(),
  redirect: vi.fn(),
  yarFlash: vi.fn()
}

const makeProfile = ({
  directAssignments = [],
  inboundDelegations = []
} = {}) => ({
  direct_assignments: directAssignments,
  inbound_delegations: inboundDelegations,
  outbound_delegations: []
})

const makeRequest = (query = {}) => ({
  auth: { credentials: { sub: 'user-123' } },
  query,
  path: '/account/cphs',
  yar: { flash: mocks.yarFlash }
})

const makeH = () => ({ view: mocks.view, redirect: mocks.redirect })

describe('buildCphRows()', () => {
  test('it maps direct assignments to own rows', () => {
    // Arrange
    const profile = makeProfile({
      directAssignments: [{ county_parish_holding_number: '12/345/6789' }]
    })

    // Act
    const result = buildCphRows(profile)

    // Assert
    expect(result).toEqual([
      { cphNumber: '12/345/6789', ownerLabel: 'You', delegationId: null }
    ])
  })

  test('it maps accepted inbound delegations to delegated rows', () => {
    // Arrange
    const profile = makeProfile({
      inboundDelegations: [
        {
          id: 'del-1',
          county_parish_holding_number: '55/200/3001',
          delegating_user_name: 'Jane Smith',
          invitation_accepted_at: '2024-01-01T00:00:00Z',
          active: true,
          invitation_rejected_at: null,
          revoked_at: null
        }
      ]
    })

    // Act
    const result = buildCphRows(profile)

    // Assert
    expect(result).toEqual([
      {
        cphNumber: '55/200/3001',
        ownerLabel: 'Jane Smith',
        delegationId: 'del-1'
      }
    ])
  })

  test('it excludes pending (unaccepted) inbound delegations', () => {
    // Arrange
    const profile = makeProfile({
      inboundDelegations: [
        {
          id: 'del-1',
          county_parish_holding_number: '55/200/3001',
          delegating_user_name: 'Jane Smith',
          invitation_accepted_at: null,
          active: false,
          invitation_rejected_at: null,
          revoked_at: null
        }
      ]
    })

    // Act
    const result = buildCphRows(profile)

    // Assert
    expect(result).toEqual([])
  })

  test('it sorts rows by CPH number ascending', () => {
    // Arrange
    const profile = makeProfile({
      directAssignments: [
        { county_parish_holding_number: '99/999/9999' },
        { county_parish_holding_number: '10/100/0001' }
      ]
    })

    // Act
    const result = buildCphRows(profile)

    // Assert
    expect(result.map((r) => r.cphNumber)).toEqual([
      '10/100/0001',
      '99/999/9999'
    ])
  })

  test('it returns an empty array when the profile has no assignments or delegations', () => {
    // Arrange
    const profile = makeProfile()

    // Act
    const result = buildCphRows(profile)

    // Assert
    expect(result).toEqual([])
  })
})

describe('listController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    mocks.yarFlash.mockReturnValue([])
    mocks.view.mockReturnValue('view-response')
    mocks.redirect.mockReturnValue('redirect-response')
  })

  test('it renders the cphs list page with no query page', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(
      makeProfile({
        directAssignments: [{ county_parish_holding_number: '12/345/6789' }]
      })
    )
    const request = makeRequest()
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
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith(
      'cphs/index',
      expect.objectContaining({
        pageTitle: 'County Parish Holdings you can manage',
        totalCount: 1,
        showingCount: 1,
        page: 1,
        pagination: null
      })
    )
    expect(result).toBe('view-response')
  })

  test('it redirects when page query is invalid', async () => {
    // Arrange
    const request = makeRequest({ page: 'bad' })
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
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it redirects when page exceeds total pages', async () => {
    // Arrange
    const request = makeRequest({ page: '99' })
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
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it passes flash data to the view', async () => {
    // Arrange
    const flash = {
      removed: true,
      cphNumber: '12/345/6789',
      ownerName: 'Jane Smith'
    }
    mocks.yarFlash.mockReturnValue([flash])
    const request = makeRequest()
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
      'cphs/index',
      expect.objectContaining({ flash })
    )
    expect(result).toBe('view-response')
  })
})
