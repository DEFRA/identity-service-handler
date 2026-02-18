import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'
import { create } from './signoutController.js'

function createConfig({
  baseUrl = 'https://identity-service-handler.defra.gov.uk',
  secure = true
} = {}) {
  return {
    get: vi.fn((key) => {
      if (key === 'idService.handler.baseUrl') {
        return baseUrl
      }

      if (key === 'session.cookie.secure') {
        return secure
      }

      throw new Error(`Unexpected config key: ${key}`)
    })
  }
}

describe('#signoutController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should clear session, forward OIDC params and keep supplied post logout redirect uri', async () => {
    const config = createConfig({ secure: false })
    const handler = create({ config })

    const state = vi.fn()
    const redirectResponse = { state }
    const h = {
      redirect: vi.fn(() => redirectResponse)
    }
    const request = {
      query: {
        post_logout_redirect_uri:
          'https://calling-service.defra.gov.uk/after-logout',
        client_id: 'my-client-id',
        id_token_hint: 'id-token-hint'
      },
      headers: {},
      cookieAuth: {
        clear: vi.fn()
      }
    }

    const result = await handler(request, h)
    const redirectTo = new URL(h.redirect.mock.calls[0][0])

    expect(request.cookieAuth.clear).toHaveBeenCalledTimes(1)
    expect(redirectTo.pathname).toBe('/oidc/signout')
    expect(redirectTo.searchParams.get('client_id')).toBe('my-client-id')
    expect(redirectTo.searchParams.get('id_token_hint')).toBe('id-token-hint')
    expect(state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/after-logout'),
      expect.objectContaining({
        path: '/',
        isSecure: false,
        isHttpOnly: true,
        isSameSite: 'Lax',
        ttl: 5 * 60 * 1000,
        encoding: 'none'
      })
    )
    expect(result).toBe(redirectResponse)
  })

  test('Should fallback to caller root from referer when post logout redirect uri is missing', async () => {
    const config = createConfig()
    const handler = create({ config })

    const state = vi.fn()
    const h = {
      redirect: vi.fn(() => ({ state }))
    }
    const request = {
      query: {},
      headers: {
        referer: 'https://calling-service.defra.gov.uk/section/path?foo=bar'
      },
      cookieAuth: {
        clear: vi.fn()
      }
    }

    await handler(request, h)

    expect(state).toHaveBeenCalledWith(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent('https://calling-service.defra.gov.uk/'),
      expect.any(Object)
    )
  })
})
