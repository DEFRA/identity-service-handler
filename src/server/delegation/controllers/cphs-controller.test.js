import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'
import { cphsController, cphsSubmitController } from './cphs-controller.js'

const mocks = {
  getUserContext: vi.fn(),
  createInvite: vi.fn(),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

describe('cphsController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the cphs page with stored selections', async () => {
    // Arrange
    const userService = {
      getUserContext: mocks.getUserContext
    }
    const request = {}
    mocks.getUserContext.mockResolvedValue({
      primary_cph: [
        { cph: '12/345/6789', role: 'Owner' },
        { cph: '35/345/0005', role: 'Sole Occupier' }
      ]
    })
    vi.spyOn(DelegationDraftService.prototype, 'getCphs').mockReturnValue([
      '12/345/6789'
    ])
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await cphsController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserContext).toHaveBeenCalledWith(undefined)
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Define delegation access',
        heading: 'Define delegation access',
        caption:
          'Select the County Parish Holdings that your want your delegate to have access to',
        checkboxItems: [
          {
            value: '12/345/6789',
            text: 'County Parish Holding Number 12/345/6789',
            checked: true
          }
        ],
        formValues: {
          cphs: ['12/345/6789']
        },
        errors: {}
      })
    )
    expect(result).toBe('view-response')
  })
})

describe('cphsSubmitController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it stores cphs, creates the invite and renders the confirmation page', async () => {
    // Arrange
    const userService = {
      getUserContext: mocks.getUserContext
    }
    const setCphs = vi
      .spyOn(DelegationDraftService.prototype, 'setCphs')
      .mockReturnValue(undefined)
    const getFullName = vi
      .spyOn(DelegationDraftService.prototype, 'getFullName')
      .mockReturnValue('Joe Bloggs')
    const getEmail = vi
      .spyOn(DelegationDraftService.prototype, 'getEmail')
      .mockReturnValue('joe@example.gov.uk')
    const getSpecies = vi
      .spyOn(DelegationDraftService.prototype, 'getSpecies')
      .mockReturnValue(['cattle'])
    const getCphs = vi
      .spyOn(DelegationDraftService.prototype, 'getCphs')
      .mockReturnValue(['12/345/6789'])
    const clearDraft = vi
      .spyOn(DelegationDraftService.prototype, 'clearDraft')
      .mockReturnValue(undefined)
    const delegationService = {
      createInvite: mocks.createInvite
    }
    mocks.getUserContext.mockResolvedValue({
      primary_cph: [{ cph: '12/345/6789', role: 'Owner' }]
    })
    mocks.createInvite.mockResolvedValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: {
        cphs: ['12/345/6789']
      }
    }
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await cphsSubmitController(
      delegationService,
      userService
    ).handler(request, h)

    // Assert
    expect(mocks.getUserContext).toHaveBeenCalledWith('user-123')
    expect(setCphs).toHaveBeenCalledWith(['12/345/6789'])
    expect(getFullName).toHaveBeenCalledTimes(1)
    expect(getEmail).toHaveBeenCalledTimes(2)
    expect(getSpecies).toHaveBeenCalledTimes(1)
    expect(getCphs).toHaveBeenCalledTimes(1)
    expect(mocks.createInvite).toHaveBeenCalledWith('user-123', {
      name: 'Joe Bloggs',
      email: 'joe@example.gov.uk',
      species: ['cattle'],
      cphs: ['12/345/6789']
    })
    expect(clearDraft).toHaveBeenCalledTimes(1)
    expect(mocks.view).toHaveBeenCalledWith('delegation/confirmation', {
      pageTitle: 'You delegation invite has been sent',
      heading: 'You delegation invite has been sent',
      email: 'joe@example.gov.uk'
    })
    expect(result).toBe('view-response')
  })

  test('it re-renders cphs page from failAction when nothing is selected', async () => {
    // Arrange
    const userService = {
      getUserContext: mocks.getUserContext
    }
    const request = {
      payload: {}
    }
    mocks.getUserContext.mockResolvedValue({
      primary_cph: [{ cph: '12/345/6789', role: 'Owner' }]
    })
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    const result = await cphsSubmitController(
      {
        createInvite: mocks.createInvite
      },
      userService
    ).options.validate.failAction(request, h, { details: [] })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Error: Define delegation access',
        checkboxItems: [
          {
            value: '12/345/6789',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: []
        },
        errors: {
          cphs: 'Select at least one County Parish Holding'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })

  test('it re-renders cphs page from failAction when cph format is invalid', async () => {
    // Arrange
    const userService = {
      getUserContext: mocks.getUserContext
    }
    const request = {
      payload: {
        cphs: ['bad-value']
      }
    }
    mocks.getUserContext.mockResolvedValue({
      primary_cph: [{ cph: '12/345/6789', role: 'Owner' }]
    })
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    const result = await cphsSubmitController(
      {
        createInvite: mocks.createInvite
      },
      userService
    ).options.validate.failAction(request, h, {
      details: [{ type: 'array.includes' }]
    })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Error: Define delegation access',
        checkboxItems: [
          {
            value: '12/345/6789',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: ['bad-value']
        },
        errors: {
          cphs: 'Enter a County Parish Holding in the correct format, like 12/345/6789'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })

  test('it re-renders cphs page when submitted cphs are outside the user context', async () => {
    // Arrange
    const userService = {
      getUserContext: mocks.getUserContext
    }
    vi.spyOn(DelegationDraftService.prototype, 'setCphs').mockReturnValue(
      undefined
    )
    const delegationService = {
      createInvite: mocks.createInvite
    }
    mocks.getUserContext.mockResolvedValue({
      primary_cph: [{ cph: '12/345/6789', role: 'Owner' }]
    })
    mocks.code.mockReturnValue('code-response')
    mocks.view.mockReturnValue({ code: mocks.code })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: {
        cphs: ['35/345/0005']
      }
    }
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await cphsSubmitController(
      delegationService,
      userService
    ).handler(request, h)

    // Assert
    expect(mocks.createInvite).not.toHaveBeenCalled()
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        checkboxItems: [
          {
            value: '12/345/6789',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: ['35/345/0005']
        },
        errors: {
          cphs: 'Select County Parish Holdings from your available list'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(result).toBe('code-response')
  })
})
