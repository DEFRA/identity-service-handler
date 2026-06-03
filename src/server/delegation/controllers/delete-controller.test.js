import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import {
  deleteController,
  deleteSubmitController
} from './delete-controller.js'
import * as delegationService from '../../services/delegation.js'
import * as delegation from '../../common/helpers/delegation.js'

const mocks = {
  getUserProfile: vi.spyOn(userService, 'getUserProfile'),
  getDelegate: vi.spyOn(delegation, 'getDelegate'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn(),
  yarFlash: vi.fn()
}

const profile = {
  outbound_delegations: [],
  direct_assignments: []
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
      delegation_id: 'del-2'
    }
  ]
}

describe('deleteController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the delete confirmation view with delegated user details', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' }
    }
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await deleteController.handler(request, h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.getDelegate).toHaveBeenCalledWith(
      profile,
      'delegated-user-456'
    )
    expect(mocks.view).toHaveBeenCalledWith('delegation/delete', {
      pageTitle: 'Remove delegate',
      heading: 'Are you sure you want to remove this delegate?',
      delegated_user_id: 'delegated-user-456',
      delegated_user_email: 'joe@example.gov.uk'
    })
    expect(result).toBe('view-response')
  })

  test('it redirects to /delegation when the delegated user is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-user' }
    }
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await deleteController.handler(request, h)

    // Assert
    expect(mocks.view).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})

describe('deleteSubmitController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('on success it flashes removed and redirects to the delegation list', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteSubmitController.handler(request, h)

    // Assert
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-2')
    expect(mocks.yarFlash).toHaveBeenCalledWith('delegationFlash', {
      removed: true,
      email: 'joe@example.gov.uk'
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('on partial failure it flashes failed CPH numbers and redirects to manage', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await deleteSubmitController.handler(request, h)

    // Assert
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      failedAdds: [],
      failedRevokes: ['35/345/0005']
    })
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/delegation/delegated-user-456/manage'
    )
  })

  test('on total failure it flashes all failed CPH numbers and redirects to manage', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation.mockRejectedValue(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await deleteSubmitController.handler(request, h)

    // Assert
    expect(mocks.yarFlash).toHaveBeenCalledWith('manageFlash', {
      failedAdds: [],
      failedRevokes: ['12/345/6789', '35/345/0005']
    })
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/delegation/delegated-user-456/manage'
    )
  })

  test('it redirects to /delegation when the delegated user is not found', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'unknown-user' },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteSubmitController.handler(request, h)

    // Assert
    expect(mocks.revokeDelegation).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})
