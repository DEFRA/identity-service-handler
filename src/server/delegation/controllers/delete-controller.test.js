import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  deleteController,
  deleteSubmitController
} from './delete-controller.js'

const mocks = {
  getDelegation: vi.fn(),
  deleteDelegation: vi.fn(),
  view: vi.fn(),
  redirect: vi.fn()
}

describe('deleteController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it renders the delete confirmation view for an active delegate', async () => {
    // Arrange
    const delegate = {
      id: 'delegate-1',
      name: 'Joe Bloggs',
      email: 'j*****@gmail.com',
      active: true
    }
    const delegationService = {
      getDelegation: mocks.getDelegation
    }
    mocks.getDelegation.mockResolvedValue(delegate)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegateId: 'delegate-1' }
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await deleteController(delegationService).handler(request, h)

    // Assert
    expect(delegationService.getDelegation).toHaveBeenCalledWith(
      'user-123',
      'delegate-1'
    )
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/delete',
      expect.objectContaining({
        pageTitle: 'Delete delegate',
        heading: 'Are you sure you want to delete this delegate?',
        delegate
      })
    )
    expect(result).toBe('view-response')
  })

  test('it renders the revoke confirmation view for an inactive delegate', async () => {
    // Arrange
    const delegate = {
      id: 'delegate-2',
      name: 'A Another',
      email: 'a*****@farminc.com',
      active: false
    }
    const delegationService = {
      getDelegation: mocks.getDelegation
    }
    mocks.getDelegation.mockResolvedValue(delegate)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegateId: 'delegate-2' }
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    await deleteController(delegationService).handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/delete',
      expect.objectContaining({
        pageTitle: 'Revoke invite',
        heading: 'Are you sure you want to revoke this invite?',
        delegate
      })
    )
  })

  test('it redirects to delegation list when delegate is not found', async () => {
    // Arrange
    const delegationService = {
      getDelegation: mocks.getDelegation
    }
    mocks.getDelegation.mockResolvedValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegateId: 'missing-id' }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteController(delegationService).handler(request, h)

    // Assert
    expect(delegationService.getDelegation).toHaveBeenCalledWith(
      'user-123',
      'missing-id'
    )
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})

describe('deleteSubmitController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it deletes the delegation and redirects to list', async () => {
    // Arrange
    const delegationService = {
      deleteDelegation: mocks.deleteDelegation
    }
    mocks.deleteDelegation.mockResolvedValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegateId: 'delegate-1' }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await deleteSubmitController(delegationService).handler(
      request,
      h
    )

    // Assert
    expect(delegationService.deleteDelegation).toHaveBeenCalledWith(
      'user-123',
      'delegate-1'
    )
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})
