import Wreck from '@hapi/wreck'

const redirectUrl = new URL('https://localhost:3005/')
const brokerBaseUrl = process.env.BROKER_BASE_URL ?? 'https://localhost:3000'
const clientId =
  process.env.OIDC_CLIENT_ID ?? 'a3d4e5f6-7890-4b1c-a2d3-e4f567890abc'
const clientSecret =
  process.env.OIDC_CLIENT_SECRET ??
  'S!uhSylf@klNy*HyI^~7vKz9EO"ACrmRTHrL>tpl)"[^~7TPaE3^u:<XfH9HYV#S{nj#@;nje"cKF6|bq9}h^AOci`sB",$lIv3]d|6"-l!U[]U40!th|PtkIhvC0u@J'

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
  return {
    pageTitle: 'Home',
    heading: 'Home',
    logon_response: formatForView(request.yar.get('brokerTokenResponse')),
    context_response: formatForView(request.yar.get('brokerContextResponse'))
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

    return h.redirect(
      `https://localhost:3000/signout?post_logout_redirect_uri=${redirectUrl}`
    )
  }
}

export const refreshController = {
  handler(_request, h) {
    _request.yar.reset()

    const loginUrl =
      'https://localhost:3000/authorize?' +
      `client_id=${clientId}&` +
      `grant_type=refresh_token&` +
      `redirect_uri=${redirectUrl}callback`

    return h.redirect(loginUrl)
  }
}

export const loginController = {
  handler(_request, h) {
    _request.yar.reset()

    const authUrl = new URL('https://localhost:3000/authorize')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append(
      'redirect_uri',
      'https://localhost:3005/callback'
    )
    authUrl.searchParams.append('scope', 'openid')
    console.log(authUrl.toString())
    return h.redirect(authUrl.toString())
  }
}

export const loginCallbackController = {
  async handler(request, h) {
    const code = request.query.code

    if (!code) {
      request.yar.set('brokerTokenResponse', {
        error: 'missing_code',
        error_description: 'No authorization code was found in callback query'
      })
      return h.redirect('/')
    }

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      scope: `${clientId}`,
      redirect_uri: `${redirectUrl}callback`
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
      const res = await Wreck.post('https://localhost:3000/token', options)
      const token = JSON.parse(res.payload.toString())

      request.yar.set('brokerTokenResponse', token)
      request.yar.set('brokerAccessToken', token.access_token)
      request.yar.set('brokerTokenType', token.token_type ?? 'Bearer')
      request.yar.set(
        'brokerTokenExpiresAt',
        Date.now() + (token.expires_in ?? 0) * 1000
      )
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
      const response = await Wreck.get(`${brokerBaseUrl}/userinfo`, {
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
