import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import * as delegationHelpers from '../../common/helpers/delegation.js'
import { accountController } from './account-controller.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getDelegates: vi.spyOn(delegationHelpers, 'getDelegates'),
  getPendingInvitations: vi.spyOn(delegationHelpers, 'getPendingInvitations'),
  getAcceptedInboundDelegations: vi.spyOn(
    delegationHelpers,
    'getAcceptedInboundDelegations'
  ),
  view: vi.fn()
}

const makeProfile = () => ({
  direct_assignments: [
    {
      county_parish_holding_id: 'cph-1',
      county_parish_holding_number: '12/345/6789'
    }
  ],
  outbound_delegations: [],
  inbound_delegations: []
})

const makeRequest = () => ({
  auth: { credentials: { sub: 'user-123' } }
})

const makeH = () => ({ view: mocks.view })

describe('accountController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    mocks.getDelegates.mockReturnValue([])
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.getAcceptedInboundDelegations.mockReturnValue([])
    mocks.view.mockReturnValue('view-response')
  })

  test('it renders the account page with correct counts', async () => {
    // Arrange
    mocks.getDelegates.mockReturnValue([{ id: 'user-a' }, { id: 'user-b' }])
    mocks.getPendingInvitations.mockReturnValue([{ id: 'inv-1' }])
    mocks.getAcceptedInboundDelegations.mockReturnValue([{ id: 'del-1' }])
    const request = makeRequest()
    const h = makeH()

    // Act
    let result, error
    try {
      result = await accountController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith('account/account', {
      pageTitle: 'Manage your County Parish Holdings',
      heading: 'Manage your County Parish Holdings',
      totalCphCount: 2,
      ownCount: 1,
      delegatedCount: 1,
      pendingInvitationsCount: 1,
      delegateCount: 2
    })
    expect(result).toBe('view-response')
  })

  test('it renders with zero counts when profile has no delegations', async () => {
    // Arrange
    const request = makeRequest()
    const h = makeH()

    // Act
    let result, error
    try {
      result = await accountController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.view).toHaveBeenCalledWith('account/account', {
      pageTitle: 'Manage your County Parish Holdings',
      heading: 'Manage your County Parish Holdings',
      totalCphCount: 1,
      ownCount: 1,
      delegatedCount: 0,
      pendingInvitationsCount: 0,
      delegateCount: 0
    })
    expect(result).toBe('view-response')
  })

  test('it renders with zero cph count when user has no direct assignments', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({
      ...makeProfile(),
      direct_assignments: []
    })
    const request = makeRequest()
    const h = makeH()

    // Act
    let result, error
    try {
      result = await accountController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.view).toHaveBeenCalledWith(
      'account/account',
      expect.objectContaining({ totalCphCount: 0, ownCount: 0 })
    )
    expect(result).toBe('view-response')
  })
})
