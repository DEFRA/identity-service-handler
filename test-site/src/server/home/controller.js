import { createHash, randomBytes } from 'node:crypto'
import Wreck from '@hapi/wreck'

const redirectUrl = new URL(
  process.env.BROKER_REDIRECT_URL ?? 'https://localhost:3005/callback'
)
const brokerBaseUrl = new URL(
  process.env.BROKER_BASE_URL ?? 'https://localhost:3000'
)
const clientId =
  process.env.OIDC_CLIENT_ID ?? 'a3d4e5f6-7890-4b1c-a2d3-e4f567890abc'
const clientSecret = process.env.OIDC_CLIENT_SECRET ?? 'secret123'
const pkceVerifierKey = 'brokerPkceVerifier'
const loginStateKey = 'brokerLoginState'

export function createPkceVerifier() {
  return randomBytes(32).toString('base64url')
}

export function createPkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url')
}

function createState() {
  return randomBytes(16).toString('base64url')
}

function formatForView(value) {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2).trim()
}

function buildHomePayload(request) {
  const refreshToken = request.yar.get('brokerRefreshToken')

  return {
    pageTitle: 'Home',
    heading: 'Home',
    logon_response: formatForView(request.yar.get('brokerTokenResponse')),
    context_response: formatForView(request.yar.get('brokerContextResponse')),
    logout_response: request.path === '/success' ? 'Logged out' : '',
    refresh_token_present: Boolean(refreshToken)
  }
}

function persistTokenResponse(
  request,
  token,
  { preserveRefreshToken = false } = {}
) {
  request.yar.set('brokerTokenResponse', token)
  request.yar.set('brokerAccessToken', token.access_token)
  request.yar.set('brokerTokenType', token.token_type ?? 'Bearer')
  request.yar.set(
    'brokerTokenExpiresAt',
    Date.now() + (token.expires_in ?? 0) * 1000
  )

  if (typeof token.refresh_token === 'string' && token.refresh_token.trim()) {
    request.yar.set('brokerRefreshToken', token.refresh_token)
    return
  }

  if (!preserveRefreshToken) {
    request.yar.clear('brokerRefreshToken')
  }
}

export const homeController = {
  handler(request, h) {
    return h.view('home/index', buildHomePayload(request))
  }
}

export const signoutController = {
  handler(_request, h) {
    _request.yar.reset()

    const signOutUrl = new URL('signout', brokerBaseUrl)
    signOutUrl.searchParams.append(
      'post_logout_redirect_uri',
      new URL('success', redirectUrl).href
    )

    console.log(signOutUrl.href)
    return h.redirect(signOutUrl.href)
  }
}

export const loginController = {
  handler(request, h) {
    request.yar.reset()

    const codeVerifier = createPkceVerifier()
    const state = createState()

    request.yar.set(pkceVerifierKey, codeVerifier)
    request.yar.set(loginStateKey, state)

    const authUrl = new URL('authorize', brokerBaseUrl)
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('redirect_uri', redirectUrl.href)
    authUrl.searchParams.append('scope', 'openid offline_access')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append(
      'code_challenge',
      createPkceChallenge(codeVerifier)
    )
    authUrl.searchParams.append('code_challenge_method', 'S256')

    console.log(authUrl.href)
    return h.redirect(authUrl.href)
  }
}

export const loginCallbackController = {
  async handler(request, h) {
    const code = request.query.code
    const state = request.query.state
    const expectedState = request.yar.get(loginStateKey)
    const codeVerifier = request.yar.get(pkceVerifierKey)

    if (!code) {
      request.yar.set('brokerTokenResponse', {
        error: 'missing_code',
        error_description: 'No authorization code was found in callback query'
      })
      return h.redirect('/')
    }

    if (!state || !expectedState || state !== expectedState) {
      request.yar.set('brokerTokenResponse', {
        error: 'invalid_state',
        error_description: 'Authorization response state did not match session'
      })
      return h.redirect('/')
    }

    if (!codeVerifier) {
      request.yar.set('brokerTokenResponse', {
        error: 'missing_code_verifier',
        error_description: 'No PKCE code verifier in session, login first'
      })
      return h.redirect('/')
    }

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${redirectUrl}`,
      code_verifier: codeVerifier
    }).toString()
    const options = {
      payload: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      rejectUnauthorized: false
    }

    try {
      const res = await Wreck.post(`${brokerBaseUrl}token`, options)
      const token = JSON.parse(res.payload.toString())

      request.yar.clear(pkceVerifierKey)
      request.yar.clear(loginStateKey)
      persistTokenResponse(request, token)
      request.yar.clear('brokerContextResponse')

      return h.redirect('/')
    } catch (error) {
      console.error('Failed to exchange authorization code for token', error)
      request.yar.set('brokerTokenResponse', {
        error: 'token_exchange_failed',
        message: error.message
      })
      return h.redirect('/')
    }
  }
}

export const refreshTokenController = {
  async handler(request, h) {
    const refreshToken = request.yar.get('brokerRefreshToken')

    if (!refreshToken) {
      request.yar.set('brokerTokenResponse', {
        error: 'missing_refresh_token',
        error_description: 'No refresh token in session, login first'
      })
      return h.redirect('/')
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    }).toString()

    const options = {
      payload: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      rejectUnauthorized: false
    }

    try {
      const res = await Wreck.post(`${brokerBaseUrl}token`, options)
      const token = JSON.parse(res.payload.toString())

      persistTokenResponse(request, token, { preserveRefreshToken: true })
      request.yar.clear('brokerContextResponse')

      return h.redirect('/')
    } catch (error) {
      console.error('Failed to exchange refresh token for token', error)
      request.yar.set('brokerTokenResponse', {
        error: 'refresh_failed',
        message: error.message
      })
      return h.redirect('/')
    }
  }
}

export const getContextController = {
  async handler(request, h) {
    const accessToken = request.yar.get('brokerAccessToken')
    const tokenType = request.yar.get('brokerTokenType') ?? 'Bearer'

    if (!accessToken) {
      request.yar.set('brokerContextResponse', {
        error: 'no_token',
        error_description: 'No access token in session, login first'
      })
      return h.redirect('/')
    }

    try {
      const response = await Wreck.get(`${brokerBaseUrl}userinfo`, {
        headers: {
          Accept: 'application/json',
          Authorization: `${tokenType} ${accessToken}`
        },
        rejectUnauthorized: false
      })

      const payload = JSON.parse(response.payload.toString())
      request.yar.set('brokerContextResponse', payload)
    } catch (error) {
      request.yar.set('brokerContextResponse', {
        error: 'context_call_failed',
        message: error.message
      })
      console.error('Failed to call broker /userinfo', error)
    }

    return h.redirect('/')
  }
}
