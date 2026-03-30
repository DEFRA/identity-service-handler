import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'
import {
  createController,
  createSubmitController
} from './create-controller.js'

const mocks = {
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

describe('createController()', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it renders the create page with default view model', async () => {
    // Arrange
    const request = {}
    vi.spyOn(DelegationDraftService.prototype, 'getEmail').mockReturnValue(
      undefined
    )
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await createController().handler(request, h)

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
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  test('it stores email and redirects on valid payload', async () => {
    // Arrange
    const setEmail = vi
      .spyOn(DelegationDraftService.prototype, 'setEmail')
      .mockReturnValue(undefined)
    const request = {
      payload: {
        email: '  JOE@EXAMPLE.COM  '
      }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await createSubmitController().handler(request, h)

    // Assert
    expect(setEmail).toHaveBeenCalledWith('joe@example.com')
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation/create/species')
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
    const result = await createSubmitController().options.validate.failAction(
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
    await createSubmitController().options.validate.failAction(request, h, err)

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
