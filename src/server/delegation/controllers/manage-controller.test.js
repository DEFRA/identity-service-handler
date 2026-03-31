import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  manageController,
  manageUpdateController
} from './manage-controller.js'

const mocks = {
  getDelegation: vi.fn(),
  updateDelegation: vi.fn(),
  getUserContext: vi.fn(),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

const delegationService = {
  getDelegation: mocks.getDelegation,
  updateDelegation: mocks.updateDelegation
}

const userService = {
  getUserContext: mocks.getUserContext
}

const delegate = {
  id: 'delegate-123',
  name: 'Joe Bloggs',
  email: 'joe@example.gov.uk',
  cphs: ['12/345/6789']
}

const userContext = {
  primary_cph: [
    { cph: '12/345/6789', role: 'Owner' },
    { cph: '35/345/0005', role: 'Sole Occupier' }
  ]
}

describe('manageController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the manage page with checkboxes pre-selected from the delegate', async () => {
    // Arrange
    mocks.getDelegation.mockResolvedValue(delegate)
    mocks.getUserContext.mockResolvedValue(userContext)
    mocks.view.mockReturnValue('view-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegation_id: 'delegate-123' }
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageController(
      delegationService,
      userService
    ).handler(request, h)

    // Assert
    expect(mocks.getDelegation).toHaveBeenCalledWith('user-123', 'delegate-123')
    expect(mocks.getUserContext).toHaveBeenCalledWith('user-123')
    expect(mocks.view).toHaveBeenCalledWith('delegation/manage', {
      pageTitle: 'Manage delegate',
      heading: 'Manage delegate',
      delegate,
      checkboxItems: [
        {
          value: '12/345/6789',
          text: 'County Parish Holding Number 12/345/6789',
          checked: true
        }
      ]
    })
    expect(result).toBe('view-response')
  })

  test('it redirects to /delegation when the delegate is not found', async () => {
    // Arrange
    mocks.getDelegation.mockResolvedValue(null)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegation_id: 'unknown-id' }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageController(
      delegationService,
      userService
    ).handler(request, h)

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })
})

describe('manageUpdateController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it updates the delegation and redirects', async () => {
    // Arrange
    mocks.updateDelegation.mockResolvedValue(undefined)
    mocks.redirect.mockReturnValue('redirect-response')
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegation_id: 'delegate-123' },
      payload: { cphs: ['12/345/6789'] }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await manageUpdateController(
      delegationService,
      userService
    ).handler(request, h)

    // Assert
    expect(mocks.updateDelegation).toHaveBeenCalledWith(
      'user-123',
      'delegate-123',
      { cphs: ['12/345/6789'] }
    )
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders the manage page from failAction when nothing is selected', async () => {
    // Arrange
    mocks.getDelegation.mockResolvedValue(delegate)
    mocks.getUserContext.mockResolvedValue(userContext)
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegation_id: 'delegate-123' },
      payload: {}
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageUpdateController(
      delegationService,
      userService
    ).options.validate.failAction(request, h, { details: [] })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/manage',
      expect.objectContaining({
        pageTitle: 'Error: Manage delegate',
        heading: 'Manage delegate',
        delegate,
        checkboxItems: [
          {
            value: '12/345/6789',
            text: 'County Parish Holding Number 12/345/6789',
            checked: false
          }
        ],
        errors: {
          cphs: 'Select at least one County Parish Holding'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })

  test('it re-renders the manage page from failAction when cph format is invalid', async () => {
    // Arrange
    mocks.getDelegation.mockResolvedValue(delegate)
    mocks.getUserContext.mockResolvedValue(userContext)
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      params: { delegation_id: 'delegate-123' },
      payload: { cphs: ['bad-value'] }
    }
    const h = { view: mocks.view }

    // Act
    const result = await manageUpdateController(
      delegationService,
      userService
    ).options.validate.failAction(request, h, {
      details: [{ type: 'array.includes' }]
    })

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/manage',
      expect.objectContaining({
        pageTitle: 'Error: Manage delegate',
        errors: {
          cphs: 'Enter a County Parish Holding in the correct format, like 12/345/6789'
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })
})
