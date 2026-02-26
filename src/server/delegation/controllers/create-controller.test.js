import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  createController,
  createSubmitController
} from './create-controller.js'

const mocks = {
  createInvite: vi.fn(),
  view: vi.fn(),
  redirect: vi.fn(),
  code: vi.fn(),
  takeover: vi.fn()
}

describe('createController()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it renders the create page with default view model', async () => {
    // Arrange
    const request = {}
    mocks.view.mockReturnValue('view-response')
    const h = { view: mocks.view }

    // Act
    const result = await createController().handler(request, h)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Add and invite a new delegate',
        heading: 'Add and invite a new delegate',
        formValues: {
          fullName: '',
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
    vi.clearAllMocks()
  })

  test('it creates invite and redirects on valid payload', async () => {
    // Arrange
    const delegationService = {
      createInvite: mocks.createInvite
    }
    mocks.createInvite.mockResolvedValue(undefined)
    const request = {
      auth: { credentials: { sub: 'user-123' } },
      payload: {
        fullName: '  Joe Bloggs  ',
        email: '  JOE@EXAMPLE.COM  '
      }
    }
    mocks.redirect.mockReturnValue('redirect-response')
    const h = { redirect: mocks.redirect }

    // Act
    const result = await createSubmitController(delegationService).handler(
      request,
      h
    )

    // Assert
    expect(mocks.createInvite).toHaveBeenCalledWith('user-123', {
      name: 'Joe Bloggs',
      email: 'joe@example.com'
    })
    expect(mocks.redirect).toHaveBeenCalledWith('/delegation')
    expect(result).toBe('redirect-response')
  })

  test('it re-renders create page from failAction for missing fields', async () => {
    // Arrange
    const delegationService = {
      createInvite: mocks.createInvite
    }
    const request = {
      payload: {
        fullName: '',
        email: ''
      }
    }
    mocks.takeover.mockReturnValue('takeover-response')
    mocks.code.mockReturnValue({ takeover: mocks.takeover })
    mocks.view.mockReturnValue({ code: mocks.code })
    const h = { view: mocks.view }
    const err = {
      details: [
        { path: ['fullName'], type: 'string.empty' },
        { path: ['email'], type: 'string.empty' }
      ]
    }

    // Act
    const result = await createSubmitController(
      delegationService
    ).options.validate.failAction(request, h, err)

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Error: Add and invite a new delegate',
        formValues: {
          fullName: '',
          email: ''
        },
        errors: {
          fullName: 'Enter the full name',
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
    const delegationService = {
      createInvite: mocks.createInvite
    }
    const request = {
      payload: {
        fullName: 'Joe Bloggs',
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
    await createSubmitController(delegationService).options.validate.failAction(
      request,
      h,
      err
    )

    // Assert
    expect(mocks.view).toHaveBeenCalledWith(
      'delegation/create',
      expect.objectContaining({
        pageTitle: 'Error: Add and invite a new delegate',
        formValues: {
          fullName: 'Joe Bloggs',
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
