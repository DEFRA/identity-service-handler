import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'

const OIDC_SIGNOUT_PARAM_NAMES = [
  'id_token_hint',
  'client_id',
  'state',
  'ui_locales',
  'logout_hint'
]

function asCallerRoot(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return undefined
  }

  try {
    return new URL('/', rawUrl).href
  } catch {
    return undefined
  }
}

function resolvePostLogoutRedirectUri(request) {
  const suppliedPostLogoutRedirectUri = request?.query?.post_logout_redirect_uri
  if (
    typeof suppliedPostLogoutRedirectUri === 'string' &&
    suppliedPostLogoutRedirectUri.trim()
  ) {
    return suppliedPostLogoutRedirectUri.trim()
  }

  return (
    asCallerRoot(request?.headers?.referer) ??
    asCallerRoot(request?.headers?.origin) ??
    '/'
  )
}

export function create({ config }) {
  return async function (request, h) {
    request.cookieAuth.clear()

    const signoutUrl = new URL(
      'oidc/signout',
      config.get('idService.handler.baseUrl')
    )
    for (const paramName of OIDC_SIGNOUT_PARAM_NAMES) {
      const value = request?.query?.[paramName]
      if (typeof value === 'string' && value.trim()) {
        signoutUrl.searchParams.set(paramName, value.trim())
      }
    }

    const postLogoutRedirectUri = resolvePostLogoutRedirectUri(request)

    const response = h.redirect(signoutUrl.href)
    response.state(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent(postLogoutRedirectUri),
      {
        path: '/',
        isSecure: config.get('session.cookie.secure'),
        isHttpOnly: true,
        isSameSite: 'Lax',
        ttl: 5 * 60 * 1000,
        encoding: 'none'
      }
    )

    return response
  }
}
