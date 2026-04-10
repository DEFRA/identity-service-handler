import Wreck from '@hapi/wreck'
import {
  createPkceChallenge,
  loginCallbackController,
  loginController
} from './controller.js'

vi.mock('@hapi/wreck', () => ({
  default: {
    post: vi.fn()
  }
}))

describe('home controller auth flow', () => {
  test('login should always include openid in the selected scopes', () => {
    const session = new Map()
    const request = {
      method: 'post',
      payload: {
        scopes: ['profile']
      },
      yar: {
        reset: vi.fn(() => session.clear()),
        set: vi.fn((key, value) => session.set(key, value))
      }
    }
    const h = {
      redirect: vi.fn((value) => value)
    }

    const redirectTo = loginController.handler(request, h)
    const redirectUrl = new URL(redirectTo)

    expect(redirectUrl.pathname).toBe('/authorize')
    expect(redirectUrl.searchParams.get('scope')).toBe(
      'openid profile offline_access'
    )
    expect(redirectUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(redirectUrl.searchParams.get('prompt')).toBe('consent')
    expect(redirectUrl.searchParams.get('state')).toBe(
      session.get('brokerLoginState')
    )
    expect(redirectUrl.searchParams.get('code_challenge')).toBe(
      createPkceChallenge(session.get('brokerPkceVerifier'))
    )
  })

  test('login should default to openid when no optional scopes are selected', () => {
    const session = new Map()
    const request = {
      method: 'post',
      payload: {
        scopes: 'openid'
      },
      yar: {
        reset: vi.fn(() => session.clear()),
        set: vi.fn((key, value) => session.set(key, value))
      }
    }
    const h = {
      redirect: vi.fn((value) => value)
    }

    const redirectTo = loginController.handler(request, h)
    const redirectUrl = new URL(redirectTo)

    expect(redirectUrl.searchParams.get('scope')).toBe('openid offline_access')
  })

  test('callback should send the PKCE verifier to the token endpoint', async () => {
    const session = new Map([
      ['brokerPkceVerifier', 'verifier-123'],
      ['brokerLoginState', 'state-123']
    ])
    Wreck.post.mockResolvedValue({
      payload: Buffer.from(
        JSON.stringify({
          access_token: 'access-token',
          token_type: 'Bearer',
          expires_in: 900,
          refresh_token: 'refresh-token'
        })
      )
    })

    const request = {
      query: {
        code: 'auth-code',
        state: 'state-123'
      },
      yar: {
        get: vi.fn((key) => session.get(key)),
        set: vi.fn((key, value) => session.set(key, value)),
        clear: vi.fn((key) => session.delete(key))
      }
    }
    const h = {
      redirect: vi.fn((value) => value)
    }

    const response = await loginCallbackController.handler(request, h)
    const body = new URLSearchParams(Wreck.post.mock.calls[0][1].payload)

    expect(response).toBe('/')
    expect(body.get('code_verifier')).toBe('verifier-123')
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(request.yar.clear).toHaveBeenCalledWith('brokerPkceVerifier')
    expect(request.yar.clear).toHaveBeenCalledWith('brokerLoginState')
    expect(session.get('brokerRefreshToken')).toBe('refresh-token')
  })
})
