import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import { cphsController, cphsSubmitController } from './cphs-controller.js'

const ASSOCIATION_1 = {
  county_parish_holding_id: 'cph-id-1',
  county_parish_holding_number: '12/345/6789'
}
const ASSOCIATION_2 = {
  county_parish_holding_id: 'cph-id-2',
  county_parish_holding_number: '35/345/0005'
}

const mocks = {
  getUserCphs: vi.fn(),
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
      getUserCphs: mocks.getUserCphs
    }
    const request = {}
    mocks.getUserCphs.mockResolvedValue({
      associations: [ASSOCIATION_1, ASSOCIATION_2]
    })
    vi.spyOn(DelegationBuilder.prototype, 'getCphIds').mockReturnValue([
      'cph-id-1'
    ])
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await cphsController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserCphs).toHaveBeenCalledWith(undefined)
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Manage access to your County Parish Holdings',
        heading: 'Manage access to your County Parish Holdings',
        caption:
          'Select the County Parish Holdings that you want your delegate to have access to',
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
        formValues: {
          cphs: ['cph-id-1']
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

  test('it stores cphs and redirects to confirm', async () => {
    // Arrange
    const userService = {
      getUserCphs: mocks.getUserCphs
    }
    const setCphIds = vi
      .spyOn(DelegationBuilder.prototype, 'setCphIds')
      .mockReturnValue(undefined)
    mocks.getUserCphs.mockResolvedValue({
      associations: [ASSOCIATION_1]
    })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: {
        cphs: ['cph-id-1']
      }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await cphsSubmitController(userService).handler(request, h)

    // Assert
    expect(mocks.getUserCphs).toHaveBeenCalledWith('user-123')
    expect(setCphIds).toHaveBeenCalledWith(['cph-id-1'])
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/create/confirm')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders cphs page from failAction when nothing is selected', async () => {
    // Arrange
    const userService = {
      getUserCphs: mocks.getUserCphs
    }
    const request = {
      payload: {}
    }
    mocks.getUserCphs.mockResolvedValue({
      associations: [ASSOCIATION_1]
    })
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    const result = await cphsSubmitController(
      userService
    ).options.validate.failAction(request, h, { details: [] })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Error: Manage access to your County Parish Holdings',
        checkboxItems: [
          {
            value: 'cph-id-1',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: new Set()
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
      getUserCphs: mocks.getUserCphs
    }
    const request = {
      payload: {
        cphs: ['bad-value']
      }
    }
    mocks.getUserCphs.mockResolvedValue({
      associations: [ASSOCIATION_1]
    })
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    const result = await cphsSubmitController(
      userService
    ).options.validate.failAction(request, h, {
      details: [{ type: 'array.includes' }]
    })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        pageTitle: 'Error: Manage access to your County Parish Holdings',
        checkboxItems: [
          {
            value: 'cph-id-1',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: new Set(['bad-value'])
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
      getUserCphs: mocks.getUserCphs
    }
    vi.spyOn(DelegationBuilder.prototype, 'setCphIds').mockReturnValue(
      undefined
    )
    mocks.getUserCphs.mockResolvedValue({
      associations: [ASSOCIATION_1]
    })
    mocks.code.mockReturnValue('code-response')
    mocks.view.mockReturnValue({ code: mocks.code })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: {
        cphs: ['cph-id-99']
      }
    }
    const h = { view: mocks.view, redirect: mocks.redirect }

    // Act
    const result = await cphsSubmitController(userService).handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/cphs',
      expect.objectContaining({
        checkboxItems: [
          {
            value: 'cph-id-1',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        formValues: {
          cphs: ['cph-id-99']
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
