import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user/index.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import {
  confirmController,
  confirmSubmitController
} from './confirm-controller.js'
import * as delegationService from '../../services/delegation.js'

vi.mock('../../services/user/index.js')
vi.mock('../../services/delegation.js')

const mocks = {
  getUserProfile: vi.mocked(userService.getUserProfile),
  getEmail: vi.spyOn(DelegationBuilder.prototype, 'getEmail'),
  getCphIds: vi.spyOn(DelegationBuilder.prototype, 'getCphIds'),
  clearDraft: vi.spyOn(DelegationBuilder.prototype, 'clearDraft'),
  createInvite: vi.mocked(delegationService.createInvite),
  view: vi.fn()
}

describe('confirmController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the confirm page with email and resolved cph numbers from draft', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({
      direct_assignments: [
        {
          county_parish_holding_id: 'cph-id-1',
          county_parish_holding_number: '12/345/6789'
        },
        {
          county_parish_holding_id: 'cph-id-2',
          county_parish_holding_number: '35/345/0005'
        }
      ]
    })
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1'])
    mocks.view.mockReturnValue('view-response')
    const request = { auth: { credentials: { sub: 'user-123' } } }
    const h = { view: mocks.view }

    // Act
    const result = await confirmController.handler(request, h)

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
    vi.resetAllMocks()
  })

  test('it creates one invite per CPH, clears draft and renders the confirmation page', async () => {
    // Arrange
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1', 'cph-id-2'])
    mocks.clearDraft.mockReturnValue(undefined)
    mocks.createInvite.mockResolvedValue(undefined)
    mocks.view.mockReturnValue('view-response')
    const request = { auth: { credentials: { sub: 'user-123' } } }
    const h = { view: mocks.view }

    // Act
    const result = await confirmSubmitController.handler(request, h)

    // Assert
    expect(mocks.getEmail).toHaveBeenCalledTimes(1)
    expect(mocks.getCphIds).toHaveBeenCalledTimes(1)
    expect(mocks.createInvite).toHaveBeenCalledTimes(2)
    expect(mocks.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: 'cph-id-1',
      delegatingUserId: 'user-123',
      delegatedUserEmail: 'joe@example.gov.uk'
    })
    expect(mocks.createInvite).toHaveBeenCalledWith({
      countyParishHoldingId: 'cph-id-2',
      delegatingUserId: 'user-123',
      delegatedUserEmail: 'joe@example.gov.uk'
    })
    expect(mocks.clearDraft).toHaveBeenCalledTimes(1)
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email: 'joe@example.gov.uk'
    })
    expect(result).toBe('view-response')
  })
})
