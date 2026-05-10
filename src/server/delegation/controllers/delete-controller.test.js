import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  deleteController,
  deleteSubmitController
} from './delete-controller.js'
import * as delegationService from '../../services/delegation.js'
import * as delegation from '../../common/helpers/delegation.js'

const mocks = {
  getUserProfile: vi.fn(),
  getDelegate: vi.spyOn(delegation, 'getDelegate'),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn()
}

const userService = {
  getUserProfile: mocks.getUserProfile
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
    vi.clearAllMocks()
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
    const result = await deleteController(userService).handler(request, h)

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
    const result = await deleteController(userService).handler(request, h)

    // Assert
    expect(mocks.view).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})

describe('deleteSubmitController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it revokes all delegations for the user and redirects to list', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getDelegate.mockReturnValue(delegatedUser)
    mocks.revokeDelegation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteSubmitController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-2')
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
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
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteSubmitController(userService).handler(request, h)

    // Assert
    expect(mocks.revokeDelegation).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})
