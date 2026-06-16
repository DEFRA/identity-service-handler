import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import {
  removeController,
  removeSubmitController
} from './remove-controller.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  yarFlash: vi.fn()
}

const acceptedDelegation = {
  id: 'del-1',
  county_parish_holding_number: '55/200/3001',
  delegating_user_name: 'Jane Smith',
  invitation_accepted_at: '2024-01-01T00:00:00Z',
  invitation_rejected_at: null,
  revoked_at: null
}

const makeProfile = (inboundDelegations = [acceptedDelegation]) => ({
  direct_assignments: [],
  outbound_delegations: [],
  inbound_delegations: inboundDelegations
})

const makeRequest = (delegationId = 'del-1') => ({
  auth: { credentials: { sub: 'user-123' } },
  params: { delegation_id: delegationId },
  yar: { flash: mocks.yarFlash }
})

const makeH = () => ({ view: mocks.view, redirect: mocks.redirect })

describe('removeController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    mocks.view.mockReturnValue('view-response')
    mocks.redirect.mockReturnValue('redirect-response')
    mocks.code.mockReturnValue('error-response')
  })

  test('it renders the remove confirmation page for a valid delegation', async () => {
    // Arrange
    const request = makeRequest('del-1')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith('cphs/remove', {
      pageTitle: 'Are you sure you want to stop managing this holding?',
      heading: 'Are you sure you want to stop managing this holding?',
      delegationId: 'del-1',
      cphNumber: '55/200/3001',
      ownerName: 'Jane Smith'
    })
    expect(result).toBe('view-response')
  })

  test('it redirects to /cphs when delegation is not found', async () => {
    // Arrange
    const request = makeRequest('unknown-id')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to /cphs when there are no accepted delegations', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile([]))
    const request = makeRequest('del-1')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })
})

describe('removeSubmitController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    mocks.revokeDelegation.mockResolvedValue(undefined)
    mocks.yarFlash.mockReturnValue([])
    mocks.redirect.mockReturnValue('redirect-response')
    mocks.code.mockReturnValue('error-response')
    mocks.view.mockReturnValue({ code: mocks.code })
  })

  test('it rejects the delegation and redirects to /cphs with flash', async () => {
    // Arrange
    const request = makeRequest('del-1')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeSubmitController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.yarFlash).toHaveBeenCalledWith('cphsFlash', {
      removed: true,
      cphNumber: '55/200/3001',
      ownerName: 'Jane Smith'
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it redirects to /cphs when delegation is not found', async () => {
    // Arrange
    const request = makeRequest('unknown-id')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeSubmitController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.revokeDelegation).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/account/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it renders the remove page with an error when the service call fails', async () => {
    // Arrange
    mocks.revokeDelegation.mockRejectedValue(new Error('Service unavailable'))
    const request = makeRequest('del-1')
    const h = makeH()

    // Act
    let result, error
    try {
      result = await removeSubmitController.handler(request, h)
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).not.toBeDefined()
    expect(mocks.view).toHaveBeenCalledWith(
      'cphs/remove',
      expect.objectContaining({
        pageTitle:
          'Error: Are you sure you want to stop managing this holding?',
        error:
          'Something went wrong. Try again or go back to your County Parish Holdings.'
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(500)
    expect(result).toBe('error-response')
  })
})
