import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  deleteController,
  deleteSubmitController
} from './delete-controller.js'
import * as delegationService from '../../services/delegation.js'

const mocks = {
  getDelegatedUser: vi.fn(),
  revokeDelegation: vi.spyOn(delegationService, 'revokeDelegation'),
  view: vi.fn(),
  redirect: vi.fn()
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
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegated_user_id: 'delegated-user-456' }
    }
    const h = { view: mocks.view }

    // Act
    const result = await deleteController(userService).handler(request, h)

    // Assert
    expect(mocks.getDelegatedUser).toHaveBeenCalledWith(
      'user-123',
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
})

describe('deleteSubmitController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it revokes all delegations for the user and redirects to list', async () => {
    // Arrange
    mocks.getDelegatedUser.mockResolvedValue(delegatedUser)
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
    expect(mocks.getDelegatedUser).toHaveBeenCalledWith(
      'user-123',
      'delegated-user-456'
    )
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-1')
    expect(mocks.revokeDelegation).toHaveBeenCalledWith('del-2')
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})
