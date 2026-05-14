import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as userService from '../../services/user/index.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import {
  createController,
  createSubmitController
} from './create-controller.js'

vi.mock('../../services/user/index.js')

const mocks = {
  getUserProfile: vi.mocked(userService.getUserProfile),
  getEmail: vi.spyOn(DelegationBuilder.prototype, 'getEmail'),
  setEmail: vi.spyOn(DelegationBuilder.prototype, 'setEmail'),
  setCphIds: vi.spyOn(DelegationBuilder.prototype, 'setCphIds'),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

describe('createController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it renders the create page with default view model', async () => {
    // Arrange
    const request = {}
    mocks.getEmail.mockReturnValue(undefined)
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await createController.handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Add a new delegate',
        heading: 'Add a new delegate',
        formValues: {
          email: ''
        },
        errors: {}
      })
    )
    expect(result).toBe('view-response')
  })
})

describe('createSubmitController()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('it stores email and redirects to cphs when user has multiple CPHs', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({
      direct_assignments: [
        {
          county_parish_holding_id: 'cph-1',
          county_parish_holding_number: '12/345/0001'
        },
        {
          county_parish_holding_id: 'cph-2',
          county_parish_holding_number: '12/345/0002'
        }
      ]
    })
    mocks.setEmail.mockReturnValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: { email: '  JOE@EXAMPLE.COM  ' }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await createSubmitController.handler(request, h)

    // Assert
    expect(mocks.setEmail).toHaveBeenCalledWith('joe@example.com')
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/create/cphs')
    expect(result).toBe('redirect-response')
  })

  test('it auto-sets CPH and redirects to confirm when user has a single CPH', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue({
      direct_assignments: [
        {
          county_parish_holding_id: 'cph-1',
          county_parish_holding_number: '12/345/0001'
        }
      ]
    })
    mocks.setEmail.mockReturnValue(undefined)
    mocks.setCphIds.mockReturnValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: { email: 'joe@example.com' }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await createSubmitController.handler(request, h)

    // Assert
    expect(mocks.setCphIds).toHaveBeenCalledWith(['cph-1'])
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/create/confirm')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders create page from failAction when email is missing', async () => {
    // Arrange
    const request = {
      payload: {
        email: ''
      }
    }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }
    const err = {
      details: [{ path: ['email'], type: 'string.empty' }]
    }

    // Act
    const result = await createSubmitController.options.validate.failAction(
      request,
      h,
      err
    )

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Error: Add a new delegate',
        formValues: {
          email: ''
        },
        errors: {
          email: "Enter the delegate's email address"
        }
      })
    )
    expect(mocks.code).toHaveBeenCalledWith(400)
    expect(mocks.takeover).toHaveBeenCalledTimes(1)
    expect(result).toBe('takeover-response')
  })

  test('it re-renders create page from failAction when error is nested under data.details', async () => {
    // Arrange
    const request = { payload: { email: '' } }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }
    const err = {
      data: { details: [{ path: ['email'], type: 'string.empty' }] }
    }

    // Act
    await createSubmitController.options.validate.failAction(request, h, err)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        errors: { email: "Enter the delegate's email address" }
      })
    )
  })

  test('it falls back to empty errors when validation error has no details', async () => {
    // Arrange
    const request = { payload: { email: '' } }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }

    // Act
    await createSubmitController.options.validate.failAction(request, h, {})

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({ errors: {} })
    )
  })

  test('it ignores validation details for unknown fields', async () => {
    // Arrange
    const request = { payload: { email: '' } }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }
    const err = {
      details: [{ path: ['unknown-field'], type: 'string.empty' }]
    }

    // Act
    await createSubmitController.options.validate.failAction(request, h, err)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({ errors: {} })
    )
  })

  test('it re-renders create page from failAction for invalid email format', async () => {
    // Arrange
    const request = {
      payload: {
        email: 'bad-email'
      }
    }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }
    const err = {
      details: [{ path: ['email'], type: 'string.email' }]
    }

    // Act
    await createSubmitController.options.validate.failAction(request, h, err)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Error: Add a new delegate',
        formValues: {
          email: 'bad-email'
        },
        errors: {
          email:
            'Enter an email address in the correct format, like name@example.com'
        }
      })
    )
  })
})
