import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import {
  confirmController,
  confirmSubmitController
} from './confirm-controller.js'
import * as delegationService from '../../services/delegation.js'

vi.mock('../../services/user.js')
vi.mock('../../services/delegation.js')

const mocks = {
  getUserProfile: vi.mocked(userService.getUserProfile),
  getEmail: vi.spyOn(DelegationBuilder.prototype, 'getEmail'),
  getCphIds: vi.spyOn(DelegationBuilder.prototype, 'getCphIds'),
  setCphIds: vi.spyOn(DelegationBuilder.prototype, 'setCphIds'),
  clearDraft: vi.spyOn(DelegationBuilder.prototype, 'clearDraft'),
  createInvite: vi.mocked(delegationService.createInvite),
  getDefaultRoleId: vi.mocked(delegationService.getDefaultRoleId),
  view: vi.fn(),
  redirect: vi.fn(),
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
  ]
}

describe('confirmController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the confirm page with email and resolved cph numbers from draft', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1'])
    mocks.yarFlash.mockReturnValue([])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    const result = await confirmController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: 'joe@example.gov.uk',
      cphs: ['12/345/6789'],
      confirmFailure: null
    })
    expect(result).toBe('view-response')
  })

  test('it maps succeeded CPH IDs from flash to CPH numbers for partial failure banner', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-2'])
    mocks.yarFlash.mockReturnValue([{ succeededCphIds: ['cph-id-1'] }])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    await confirmController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: 'joe@example.gov.uk',
      cphs: ['35/345/0005'],
      confirmFailure: { succeededCphs: ['12/345/6789'] }
    })
  })

  test('it passes empty succeededCphs for total failure banner', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(profile)
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1', 'cph-id-2'])
    mocks.yarFlash.mockReturnValue([{ succeededCphIds: [] }])
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    await confirmController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: 'joe@example.gov.uk',
      cphs: ['12/345/6789', '35/345/0005'],
      confirmFailure: { succeededCphs: [] }
    })
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
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { view: mocks.view }

    // Act
    const result = await confirmSubmitController.handler(request, h)

    // Assert
    expect(mocks.getDefaultRoleId).toHaveBeenCalledTimes(1)
    expect(mocks.createInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        countyParishHoldingId: 'cph-id-1',
        delegatingUserId: 'user-123',
        delegatedUserEmail: 'joe@example.gov.uk',
        delegatedUserRoleId: 'role-id-1'
      })
    )
    expect(mocks.createInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        countyParishHoldingId: 'cph-id-2',
        delegatingUserId: 'user-123',
        delegatedUserEmail: 'joe@example.gov.uk',
        delegatedUserRoleId: 'role-id-1'
      })
    )
    expect(mocks.clearDraft).toHaveBeenCalledTimes(1)
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email: 'joe@example.gov.uk'
    })
    expect(result).toBe('view-response')
  })

  test('on partial failure it updates the draft to failed CPH IDs, flashes succeeded IDs and redirects to confirm', async () => {
    // Arrange
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1', 'cph-id-2'])
    mocks.setCphIds.mockReturnValue(undefined)
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.createInvite
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await confirmSubmitController.handler(request, h)

    // Assert
    expect(mocks.setCphIds).toHaveBeenCalledWith(['cph-id-2'])
    expect(mocks.yarFlash).toHaveBeenCalledWith('confirmFailure', {
      succeededCphIds: ['cph-id-1']
    })
    expect(mocks.clearDraft).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/confirm')
    expect(result).toBe('redirect-response')
  })

  test('on total failure it updates the draft to all failed CPH IDs, flashes empty succeeded and redirects', async () => {
    // Arrange
    mocks.getEmail.mockReturnValue('joe@example.gov.uk')
    mocks.getCphIds.mockReturnValue(['cph-id-1', 'cph-id-2'])
    mocks.setCphIds.mockReturnValue(undefined)
    mocks.getDefaultRoleId.mockResolvedValue('role-id-1')
    mocks.createInvite.mockRejectedValue(new Error('failed'))
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      yar: { flash: mocks.yarFlash }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await confirmSubmitController.handler(request, h)

    // Assert
    expect(mocks.setCphIds).toHaveBeenCalledWith(['cph-id-1', 'cph-id-2'])
    expect(mocks.yarFlash).toHaveBeenCalledWith('confirmFailure', {
      succeededCphIds: []
    })
    expect(mocks.clearDraft).not.toHaveBeenCalled()
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/confirm')
  })
})
