import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  manageController,
  manageUpdateController
} from './manage-controller.js'
import * as delegationService from '../../services/delegation.js'

const mocks = {
  getDelegatedUser: vi.fn(),
  createInvite: vi.spyOn(delegationService, 'createInvite'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

const userService = {
  getDelegatedUser: mocks.getDelegatedUser
}

const delegatedUser = {
  id: 'delegated-user-456',
  email: 'joe@example.gov.uk',
  cphs: [
    {
      county_parish_holding_id: 'cph-id-1',
      county_parish_holding_number: '12/345/6789',
      delegation_id: 'del-1'
    },
    {
      county_parish_holding_id: 'cph-id-2',
      county_parish_holding_number: '35/345/0005',
      delegation_id: null
    }
  ]
}

describe('manageController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it renders the manage page with checkboxes pre-selected from active delegations', async () => {
    // Arrange
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' }
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageController(userService).handler(request, h)

    // Assert
    expect(mocks.getDelegatedUser).toHaveBeenCalledWith(
      'user-123',
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
    mocks.getDelegatedUser.mockResolvedValue(null)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageController(userService).handler(request, h)

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
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
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
    const result = await manageUpdateController(userService).handler(request, h)

    // Assert
    expect(mocks.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: 'cph-id-2',
      delegatingUserId: 'user-123',
      delegatedUserId: 'delegated-user-456',
      delegatedUserEmail: 'joe@example.gov.uk'
    })
    expect(mocks.revokeDelegation).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it revokes delegations for unchecked CPHs', async () => {
    // Arrange
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
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
    await manageUpdateController(userService).handler(request, h)

    // Assert
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.createInvite).not.toHaveBeenCalled()
  })

  test('it re-renders the manage page from failAction on validation error', async () => {
    // Arrange
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
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
    const result = await manageUpdateController(
      userService
    ).options.validate.failAction(request, h, { details: [] })

    // Assert
    expect(mocks.getDelegatedUser).toHaveBeenCalledWith(
      'user-123',
      'delegated-user-456'
    )
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
