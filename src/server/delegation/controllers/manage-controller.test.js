import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../services/user/index.js', () => ({
  default: { getUserProfile: vi.fn() }
}))

import userService from '../../services/user/index.js'
import {
  manageController,
  manageUpdateController
} from './manage-controller.js'
import * as delegationService from '../../services/delegation.js'
import * as delegation from '../../common/helpers/delegation.js'

const mocks = {
  getDelegate: vi.spyOn(delegation, 'getDelegate'),
  createInvite: vi.spyOn(delegationService, 'createInvite'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

const profile = {
  direct_assignments: [
    {
      county_parish_holding_id: 'cph-id-1',
      county_parish_holding_number: '12/345/6789'
    },
    {
      county_parish_holding_id: 'cph-id-2',
      county_parish_holding_number: '35/345/0005'
    }
  ],
  outbound_delegations: []
}

const delegatedUser = {
  id: 'delegated-user-456',
  email: 'joe@example.gov.uk',
  cphs: [
    {
      county_parish_holding_id: 'cph-id-1',
      county_parish_holding_number: '12/345/6789',
      delegation_id: 'del-1'
    }
  ]
}

describe('manageController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it renders the manage page with checkboxes pre-selected from active delegations', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' }
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageController.handler(request, h)

    // Assert
    expect(userService.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.getDelegate).toHaveBeenCalledWith(
      profile,
      'delegated-user-456'
    )
    expect(mocks.view).toHaveBeenCalledWith('delegation/manage', {
      pageTitle: 'Manage delegate',
      heading: 'Manage delegate',
      delegated_user_id: 'delegated-user-456',
      delegated_user_email: 'joe@example.gov.uk',
      checkboxItems: [
        {
          value: 'cph-id-1',
          text: 'County Parish Holding Number 12/345/6789',
          checked: true
        },
        {
          value: 'cph-id-2',
          text: 'County Parish Holding Number 35/345/0005',
          checked: false
        }
      ]
    })
    expect(result).toBe('view-response')
  })

  test('it redirects to /delegation when the delegated user is not found', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageController.handler(request, h)

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})

describe('manageUpdateController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it creates invites for newly checked CPHs and revokes unchecked ones, then redirects', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.createInvite.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      // cph-id-1 already delegated (checked — no-op), cph-id-2 now checked (create)
      payload: { cphs: ['cph-id-1', 'cph-id-2'] }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: 'cph-id-2',
      delegatingUserId: 'user-123',
      delegatedUserEmail: 'joe@example.gov.uk'
    })
    expect(mocks.revokeDelegation).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it revokes delegations for unchecked CPHs', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      // nothing checked — cph-id-1 had a delegation and is now unchecked (revoke)
      payload: {}
    }
    const h = { redirect: mocks.redirect }

    // Act
    await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.createInvite).not.toHaveBeenCalled()
  })

  test('it redirects from failAction when the delegated user is not found', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.takeover.mockReturnValue('takeover-response')
    const redirect = vi.fn().mockReturnValue({ takeover: mocks.takeover })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' },
      payload: {}
    }
    const h = { redirect }

    // Act
    const result = await manageUpdateController.options.validate.failAction(
      request,
      h,
      { details: [] }
    )

    // Assert
    expect(redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('takeover-response')
  })

  test('it redirects from POST handler when the delegated user is not found', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' },
      payload: {}
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders the manage page from failAction on validation error', async () => {
    // Arrange
    userService.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      payload: {}
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageUpdateController.options.validate.failAction(
      request,
      h,
      { details: [] }
    )

    // Assert
    expect(userService.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/manage',
      expect.objectContaining({
        pageTitle: 'Error: Manage delegate',
        heading: 'Manage delegate',
        delegated_user_id: 'delegated-user-456',
        delegated_user_email: 'joe@example.gov.uk',
        errors: { cphs: 'Select at least one County Parish Holding' }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })
})
