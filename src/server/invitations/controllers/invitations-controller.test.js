import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import * as delegationHelpers from '../../common/helpers/delegation.js'
import {
  acceptInvitationController,
  acceptInvitationConfirmController,
  invitationsController,
  rejectInvitationConfirmController,
  rejectInvitationController
} from './invitations-controller.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getPendingInvitations: vi.spyOn(delegationHelpers, 'getPendingInvitations'),
  acceptInvitation: vi.spyOn(delegationService, 'acceptInvitation'),
  rejectInvitation: vi.spyOn(delegationService, 'rejectInvitation'),
  view: vi.fn(),
  redirect: vi.fn(),
  flash: vi.fn()
}

const makeH = () => ({
  view: mocks.view,
  redirect: mocks.redirect
})

const makeRequest = (overrides = {}) => ({
  auth: { credentials: { sub: 'user-123' } },
  yar: { flash: mocks.flash },
  ...overrides
})

const anInvitation = {
  id: 'del-1',
  county_parish_holding_number: '12/345/0001',
  delegating_user_name: 'John Doe'
}

describe('invitationsController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the invitations view with pending inbound delegations', async () => {
    // Arrange
    const profile = { inbound_delegations: [] }
    const invitations = [anInvitation]
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getPendingInvitations.mockReturnValue(invitations)
    mocks.flash.mockReturnValue([null])
    mocks.view.mockReturnValue('view-response')
    const request = makeRequest()

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
        invitations,
        flash: null
      })
    )
    expect(result).toBe('view-response')
  })

  test('it passes flash data to the view', async () => {
    // Arrange
    const flash = {
      accepted: true,
      cphNumber: '12/345/0001',
      delegatingUserName: 'John Doe'
    }
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.flash.mockReturnValue([flash])
    mocks.view.mockReturnValue('view-response')
    const request = makeRequest()

    // Act
    await invitationsController.handler(request, makeH())

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/index',
      expect.objectContaining({ flash })
    )
  })
})

describe('acceptInvitationConfirmController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the accept confirmation view with invitation details', async () => {
    // Arrange
    const profile = { inbound_delegations: [] }
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.view.mockReturnValue('view-response')
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await acceptInvitationConfirmController.handler(
      request,
      makeH()
    )

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/accept',
      expect.objectContaining({
        pageTitle: 'Accept invitation',
        invitationId: 'del-1',
        delegatingUserName: 'John Doe',
        cphNumber: '12/345/0001'
      })
    )
    expect(result).toBe('view-response')
  })

  test('it redirects to invitations page if the invitation is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-999' } })

    // Act
    const result = await acceptInvitationConfirmController.handler(
      request,
      makeH()
    )

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })
})

describe('rejectInvitationConfirmController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the reject confirmation view with invitation details', async () => {
    // Arrange
    const profile = { inbound_delegations: [] }
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.view.mockReturnValue('view-response')
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await rejectInvitationConfirmController.handler(
      request,
      makeH()
    )

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/reject',
      expect.objectContaining({
        pageTitle: 'Reject invitation',
        invitationId: 'del-1',
        delegatingUserName: 'John Doe',
        cphNumber: '12/345/0001'
      })
    )
    expect(result).toBe('view-response')
  })

  test('it redirects to invitations page if the invitation is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-999' } })

    // Act
    const result = await rejectInvitationConfirmController.handler(
      request,
      makeH()
    )

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })
})

describe('acceptInvitationController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it accepts the invitation, flashes success, and redirects', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.acceptInvitation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await acceptInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.acceptInvitation).toHaveBeenCalledWith('del-1')
    expect(mocks.flash).toHaveBeenCalledWith('invitationsFlash', {
      accepted: true,
      cphNumber: '12/345/0001',
      delegatingUserName: 'John Doe'
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to invitations page if the invitation is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-999' } })

    // Act
    const result = await acceptInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders the confirm page with an error if the service call fails', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.acceptInvitation.mockRejectedValue(new Error('Service unavailable'))
    const mockCode = vi.fn().mockReturnValue('error-response')
    mocks.view.mockReturnValue({ code: mockCode })
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await acceptInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/accept',
      expect.objectContaining({
        pageTitle: 'Error: Accept invitation',
        invitationId: 'del-1',
        error: expect.any(String)
      })
    )
    expect(mockCode).toHaveBeenCalledWith(500)
    expect(result).toBe('error-response')
  })
})

describe('rejectInvitationController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it rejects the invitation, flashes success, and redirects', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.rejectInvitation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await rejectInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.rejectInvitation).toHaveBeenCalledWith('del-1')
    expect(mocks.flash).toHaveBeenCalledWith('invitationsFlash', {
      rejected: true,
      cphNumber: '12/345/0001',
      delegatingUserName: 'John Doe'
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to invitations page if the invitation is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([])
    mocks.redirect.mockReturnValue('redirect-response')
    const request = makeRequest({ params: { delegation_id: 'del-999' } })

    // Act
    const result = await rejectInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/invitations')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders the confirm page with an error if the service call fails', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({ inbound_delegations: [] })
    mocks.getPendingInvitations.mockReturnValue([anInvitation])
    mocks.rejectInvitation.mockRejectedValue(new Error('Service unavailable'))
    const mockCode = vi.fn().mockReturnValue('error-response')
    mocks.view.mockReturnValue({ code: mockCode })
    const request = makeRequest({ params: { delegation_id: 'del-1' } })

    // Act
    const result = await rejectInvitationController.handler(request, makeH())

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'invitations/reject',
      expect.objectContaining({
        pageTitle: 'Error: Reject invitation',
        invitationId: 'del-1',
        error: expect.any(String)
      })
    )
    expect(mockCode).toHaveBeenCalledWith(500)
    expect(result).toBe('error-response')
  })
})
