import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import {
  confirmController,
  confirmSubmitController
} from './confirm-controller.js'
import * as delegationService from '../../services/delegation.js'

vi.mock('../../services/delegation.js')

const mocks = {
  view: vi.fn()
}

describe('confirmController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the confirm page with email and resolved cph numbers from draft', async () => {
    // Arrange
    const userService = {
      getUserCphs: vi.fn().mockResolvedValue({
        associations: [
          {
            county_parish_holding_id: 'cph-id-1',
            county_parish_holding_number: '12/345/6789'
          }
        ]
      })
    }
    vi.spyOn(DelegationBuilder.prototype, 'getEmail').mockReturnValue(
      'joe@example.gov.uk'
    )
    vi.spyOn(DelegationBuilder.prototype, 'getCphIds').mockReturnValue([
      'cph-id-1'
    ])
    mocks.view.mockReturnValue('view-response')
    const request = {}
    const h = { view: mocks.view }

    // Act
    const result = await confirmController(userService).handler(request, h)

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

  test('it creates one invite per CPH, clears draft and renders the confirmation page', async () => {
    // Arrange
    const getEmail = vi
      .spyOn(DelegationBuilder.prototype, 'getEmail')
      .mockReturnValue('joe@example.gov.uk')
    const getCphIds = vi
      .spyOn(DelegationBuilder.prototype, 'getCphIds')
      .mockReturnValue(['12/345/6789', '35/345/0005'])
    const clearDraft = vi
      .spyOn(DelegationBuilder.prototype, 'clearDraft')
      .mockReturnValue(undefined)
    vi.mocked(delegationService.createInvite).mockResolvedValue(undefined)
    mocks.view.mockReturnValue('view-response')
    const request = { auth: { credentials: { sub: 'user-123' } } }
    const h = { view: mocks.view }

    // Act
    const result = await confirmSubmitController().handler(request, h)

    // Assert
    expect(getEmail).toHaveBeenCalledTimes(1)
    expect(getCphIds).toHaveBeenCalledTimes(1)
    expect(delegationService.createInvite).toHaveBeenCalledTimes(2)
    expect(delegationService.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: '12/345/6789',
      delegatingUserId: 'user-123',
      delegatedUserEmail: 'joe@example.gov.uk'
    })
    expect(delegationService.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: '35/345/0005',
      delegatingUserId: 'user-123',
      delegatedUserEmail: 'joe@example.gov.uk'
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
