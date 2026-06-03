import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import {
  manageController,
  manageUpdateController
} from './manage-controller.js'
import * as delegationService from '../../services/delegation.js'
import * as delegation from '../../common/helpers/delegation.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getDelegate: vi.spyOn(delegation, 'getDelegate'),
  createInvite: vi.spyOn(delegationService, 'createInvite'),
  getDefaultRoleId: vi.spyOn(delegationService, 'getDefaultRoleId'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn(),
  yarFlash: vi.fn()
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
    vi.resetAllMocks()
  })

  test('it renders the manage page with checkboxes pre-selected from active delegations', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.yarFlash.mockReturnValue([])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageController.handler(request, h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
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
      ],
      flash: null
    })
    expect(result).toBe('view-response')
  })

  test('it passes flash data from yar to the view', async () => {
    // Arrange
    const flashData = { success: true }
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.yarFlash.mockReturnValue([flashData])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    await manageController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/manage',
      expect.objectContaining({ flash: flashData })
    )
  })

  test('it redirects to /delegation when the delegated user is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' },
      yar: { flash: mocks.yarFlash }
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
    vi.resetAllMocks()
  })

  test('on success it flashes success and redirects to the manage page', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.createInvite.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      payload: { cphs: ['cph-id-1', 'cph-id-2'] },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      success: true
    })
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/delegation/delegated-user-456/manage'
    )
    expect(result).toBe('redirect-response')
  })

  test('it does not call getDefaultRoleId when there are only revokes', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      // cph-id-1 removed, nothing added
      payload: { cphs: [] },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.getDefaultRoleId).not.toHaveBeenCalled()
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      success: true
    })
  })

  test('on partial failure it flashes failed CPH numbers and redirects to manage', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.createInvite.mockRejectedValue(new Error('failed'))
    mocks.revokeDelegation.mockRejectedValue(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      // cph-id-2 added (create), cph-id-1 removed (revoke)
      payload: { cphs: 'cph-id-2' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      failedAdds: ['35/345/0005'],
      failedRevokes: ['12/345/6789']
    })
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/delegation/delegated-user-456/manage'
    )
    expect(result).toBe('redirect-response')
  })

  test('on total failure it flashes all failed CPH numbers and redirects to manage', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.createInvite.mockRejectedValue(new Error('failed'))
    mocks.revokeDelegation.mockRejectedValue(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      // cph-id-2 added (create fails), cph-id-1 removed (revoke fails)
      payload: { cphs: 'cph-id-2' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController.handler(request, h)

    // Assert
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      failedAdds: ['35/345/0005'],
      failedRevokes: ['12/345/6789']
    })
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/delegation/delegated-user-456/manage'
    )
    expect(result).toBe('redirect-response')
  })

  test('it redirects from failAction when the delegated user is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
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
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-id' },
      payload: {},
      yar: { flash: mocks.yarFlash }
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
    mocks.getUserProfile.mockResolvedValue(profile)
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
