import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'
import { create } from './signoutController.js'

const mocks = {
  state: vi.fn(),
  redirect: vi.fn(),
  configGet: vi.fn()
}

function createHandler() {
  const config = { get: mocks.configGet }
  const b2cConfiguration = {
    serverMetadata: () => ({
      end_session_endpoint:
        'https://your-account.cpdev.cui.defra.gov.uk/idphub/b2c/b2c_1a_cui_cpdev_signupsignin/signout'
    })
  }

  return create({ config, b2cConfiguration })
}

function createRequest(overrides = {}) {
  return {
    query: {},
    headers: {},
    auth: {},
    cookieAuth: { clear: vi.fn() },
    yar: { get: vi.fn(), reset: vi.fn() },
    ...overrides
  }
}

describe('create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.redirect.mockReturnValue({ state: mocks.state })
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') {
        return false
      }
    })
  })

  test('it redirects to the upstream end_session_endpoint with the broker signout url', async () => {
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.origin).toBe(
      'https://your-account.cpdev.cui.defra.gov.uk'
    )
    expect(redirectTo.pathname).toBe(
      '/idphub/b2c/b2c_1a_cui_cpdev_signupsignin/signout'
    )
    expect(redirectTo.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://identity-service-handler.defra.gov.uk/oidc/signout'
    )
  })

  test('it clears cookie auth and resets the yar session', async () => {
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    expect(request.cookieAuth.clear).toHaveBeenCalledTimes(1)
    expect(request.yar.reset).toHaveBeenCalledTimes(1)
  })

  test('it uses the authenticated session upstream id token hint when available', async () => {
    const handler = createHandler()
    const request = createRequest({
      query: {
        id_token_hint: 'caller-supplied-id-token'
      },
      auth: {
        credentials: {
          upstreamIdTokenHint: 'session-upstream-id-token'
        }
      }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.searchParams.get('id_token_hint')).toBe(
      'session-upstream-id-token'
    )
  })

  test('it falls back to the yar upstream id token hint when auth credentials do not include one', async () => {
    const handler = createHandler()
    const request = createRequest({
      yar: {
        get: vi.fn(() => 'yar-upstream-id-token'),
        reset: vi.fn()
      }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.searchParams.get('id_token_hint')).toBe(
      'yar-upstream-id-token'
    )
  })

  test('it omits id_token_hint when neither session store has one', async () => {
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    expect(redirectTo.searchParams.has('id_token_hint')).toBe(false)
  })

  test('it forwards supported OIDC params to the broker signout url', async () => {
    const handler = createHandler()
    const request = createRequest({
      query: {
        client_id: 'my-client',
        state: 'my-state',
        ui_locales: 'cy',
        logout_hint: 'user@example.com'
      }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    const redirectTo = new URL(mocks.redirect.mock.calls[0][0])
    const brokerSignoutUrl = new URL(
      redirectTo.searchParams.get('post_logout_redirect_uri')
    )
    expect(brokerSignoutUrl.searchParams.get('client_id')).toBe('my-client')
    expect(brokerSignoutUrl.searchParams.get('state')).toBe('my-state')
    expect(brokerSignoutUrl.searchParams.get('ui_locales')).toBe('cy')
    expect(brokerSignoutUrl.searchParams.get('logout_hint')).toBe(
      'user@example.com'
    )
  })

  test('it uses the supplied post_logout_redirect_uri for the signout cookie', async () => {
    const handler = createHandler()
    const request = createRequest({
      query: {
        post_logout_redirect_uri:
          'https://calling-service.defra.gov.uk/after-logout'
      }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/after-logout'),
      expect.any(Object)
    )
  })

  test('it falls back to the referer root when post_logout_redirect_uri is absent', async () => {
    const handler = createHandler()
    const request = createRequest({
      headers: {
        referer: 'https://calling-service.defra.gov.uk/section/path?foo=bar'
      }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/'),
      expect.any(Object)
    )
  })

  test('it falls back to the origin root when referer is absent', async () => {
    const handler = createHandler()
    const request = createRequest({
      headers: { origin: 'https://calling-service.defra.gov.uk' }
    })
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/'),
      expect.any(Object)
    )
  })

  test('it falls back to "/" when referer and origin are both absent', async () => {
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    await handler(request, h)

    expect(mocks.state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('/'),
      expect.any(Object)
    )
  })

  test('it sets the signout cookie with the correct options', async () => {
    mocks.configGet.mockImplementation((key) => {
      if (key === 'idService.handler.baseUrl') {
        return 'https://identity-service-handler.defra.gov.uk'
      }
      if (key === 'session.cookie.secure') {
        return true
      }
    })
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    await handler(request, h)

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
    const redirectResponse = { state: mocks.state }
    mocks.redirect.mockReturnValue(redirectResponse)
    const handler = createHandler()
    const request = createRequest()
    const h = { redirect: mocks.redirect }

    const result = await handler(request, h)

    expect(result).toBe(redirectResponse)
  })
})
