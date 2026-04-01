import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'
import { create } from './signoutController.js'

const mocks = {
  state: vi.fn(),
  redirect: vi.fn(),
  configGet: vi.fn()
}

describe('create()', () => {
  beforeEach(() => {
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return true
    })
    vi.clearAllMocks()
  })

  test('it clears the session cookie', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(request.cookieAuth.clear).toHaveBeenCalledTimes(1)
  })

  test('it redirects to the oidc/signout path', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.pathname).toBe('/oidc/signout')
  })

  test('it forwards OIDC query params to the signout url', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {
        client_id: 'my-client',
        id_token_hint: 'my-hint',
        state: 'my-state'
      },
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.searchParams.get('client_id')).toBe('my-client')
    expect(redirectTo.searchParams.get('id_token_hint')).toBe('my-hint')
    expect(redirectTo.searchParams.get('state')).toBe('my-state')
  })

  test('it does not forward OIDC params that are empty or whitespace', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: { client_id: '', id_token_hint: '  ' },
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.searchParams.has('client_id')).toBe(false)
    expect(redirectTo.searchParams.has('id_token_hint')).toBe(false)
  })

  test('it uses the supplied post_logout_redirect_uri for the signout cookie', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {
        post_logout_redirect_uri:
          'https://calling-service.defra.gov.uk/after-logout'
      },
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/after-logout'),
      expect.any(Object)
    )
  })

  test('it falls back to the referer root when post_logout_redirect_uri is absent', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {
        referer: 'https://calling-service.defra.gov.uk/section/path?foo=bar'
      },
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/'),
      expect.any(Object)
    )
  })

  test('it falls back to the origin root when referer is absent', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: { origin: 'https://calling-service.defra.gov.uk' },
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/'),
      expect.any(Object)
    )
  })

  test('it falls back to "/" when referer and origin are both absent', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return false
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('/'),
      expect.any(Object)
    )
  })

  test('it sets the signout cookie with the correct options', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') return true
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        path: '/',
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax',
        ttl: 5 * 60 * 1000,
        encoding: 'none'
      })
    )
  })

  test('it returns the redirect response', async () => {
    // Arrange
    const config = { get: mocks.configGet }
    const redirectResponse = { state: mocks.state }
    mocks.redirect.mockReturnValue(redirectResponse)
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      } else if (key === 'session.cookie.secure') {
        return false
      }
    })
    const handler = create({ config })
    const request = {
      query: {},
      headers: {},
      cookieAuth: { clear: vi.fn() }
    }
    const h = { redirect: mocks.redirect }

    // Act
    const result = await handler(request, h)

    // Assert
    expect(result).toBe(redirectResponse)
  })
})
