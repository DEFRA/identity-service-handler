import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'
import {
  confirmController,
  confirmSubmitController
} from './confirm-controller.js'

const mocks = {
  createInvite: vi.fn(),
  view: vi.fn()
}

describe('confirmController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the confirm page with masked email and cphs from draft', async () => {
    // Arrange
    vi.spyOn(DelegationDraftService.prototype, 'getEmail').mockReturnValue(
      'joe@example.gov.uk'
    )
    vi.spyOn(DelegationDraftService.prototype, 'getCphs').mockReturnValue([
      '12/345/6789'
    ])
    mocks.view.mockReturnValue('view-response')
    const request = {}
    const h = { view: mocks.view }

    // Act
    const result = await confirmController().handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: 'joe@example.gov.uk',
      cphs: ['12/345/6789']
    })
    expect(result).toBe('view-response')
  })
})

describe('confirmSubmitController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it creates the invite, clears draft and renders the confirmation page', async () => {
    // Arrange
    const getEmail = vi
      .spyOn(DelegationDraftService.prototype, 'getEmail')
      .mockReturnValue('joe@example.gov.uk')
    const getCphs = vi
      .spyOn(DelegationDraftService.prototype, 'getCphs')
      .mockReturnValue(['12/345/6789'])
    const clearDraft = vi
      .spyOn(DelegationDraftService.prototype, 'clearDraft')
      .mockReturnValue(undefined)
    const delegationService = { createInvite: mocks.createInvite }
    mocks.createInvite.mockResolvedValue(undefined)
    mocks.view.mockReturnValue('view-response')
    const request = { auth: { credentials: { sub: 'user-123' } } }
    const h = { view: mocks.view }

    // Act
    const result = await confirmSubmitController(delegationService).handler(
      request,
      h
    )

    // Assert
    expect(getEmail).toHaveBeenCalledTimes(1)
    expect(getCphs).toHaveBeenCalledTimes(1)
    expect(mocks.createInvite).toHaveBeenCalledWith('user-123', {
      email: 'joe@example.gov.uk',
      cphs: ['12/345/6789']
    })
    expect(clearDraft).toHaveBeenCalledTimes(1)
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email: 'joe@example.gov.uk'
    })
    expect(result).toBe('view-response')
  })
})
