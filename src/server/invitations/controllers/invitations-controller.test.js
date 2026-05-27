import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import * as delegationHelpers from '../../common/helpers/delegation.js'
import {
  acceptInvitationController,
  invitationsController,
  rejectInvitationController
} from './invitations-controller.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getPendingInvitations: vi.spyOn(delegationHelpers, 'getPendingInvitations'),
  acceptInvitation: vi.spyOn(delegationService, 'acceptInvitation'),
  rejectInvitation: vi.spyOn(delegationService, 'rejectInvitation'),
  view: vi.fn(),
  redirect: vi.fn()
}

const makeH = () => ({ view: mocks.view, redirect: mocks.redirect })

describe('invitationsController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the invitations view with pending inbound delegations', async () => {
    // Arrange
    const profile = { inbound_delegations: [] }
    const invitations = [
      { id: 'del-1', county_parish_holding_number: '12/345/0001' }
    ]
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getPendingInvitations.mockReturnValue(invitations)
    mocks.view.mockReturnValue('view-response')
    const request = { auth: { credentials: { sub: 'user-123' } } }

    // Act
    const result = await invitationsController.handler(request, makeH())

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.getPendingInvitations).toHaveBeenCalledWith(profile)
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/index',
      expect.objectContaining({
        pageTitle: 'Invitations',
        heading: 'Invitations',
        invitations
      })
    )
    expect(result).toBe('view-response')
  })
})

describe('acceptInvitationController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it accepts the invitation and redirects to invitations page', async () => {
    // Arrange
    mocks.acceptInvitation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = { params: { delegation_id: 'del-1' } }

    // Act
    const result = await acceptInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.acceptInvitation).toHaveBeenCalledWith('del-1')
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })
})

describe('rejectInvitationController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it rejects the invitation and redirects to invitations page', async () => {
    // Arrange
    mocks.rejectInvitation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = { params: { delegation_id: 'del-1' } }

    // Act
    const result = await rejectInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.rejectInvitation).toHaveBeenCalledWith('del-1')
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })
})
