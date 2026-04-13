import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'
import { milliseconds } from '../../common/helpers/duration.js'

const OIDC_SIGNOUT_PARAM_NAMES = [
  'id_token_hint',
  'client_id',
  'state',
  'ui_locales',
  'logout_hint'
]

export function create({ config }) {
  return async function (request, h) {
    request.cookieAuth.clear()

    const signoutUrl = buildSignoutUrl(
      config.get('idService.handler.baseUrl'),
      request.query
    )
    const postLogoutRedirectUri = resolvePostLogoutRedirectUri(request)

    const response = h.redirect(signoutUrl.href)
    response.state(
      SIGNOUT_REDIRECT_COOKIE_NAME,
      encodeURIComponent(postLogoutRedirectUri),
      signoutCookieOptions(config.get('session.cookie.secure'))
    )

    return response
  }
}

function toRootUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return null
  }

  try {
    return new URL('/', rawUrl).href
  } catch {}
  return null
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
    toRootUrl(request?.headers?.referer) ??
    toRootUrl(request?.headers?.origin) ??
    '/'
  )
}

function buildSignoutUrl(baseUrl, query) {
  const url = new URL('oidc/signout', baseUrl)
  for (const paramName of OIDC_SIGNOUT_PARAM_NAMES) {
    const value = query?.[paramName]
    if (typeof value === 'string' && value.trim()) {
      url.searchParams.set(paramName, value.trim())
    }
  }
  return url
}

function signoutCookieOptions(isSecure) {
  return {
    path: '/',
    isSecure,
    isHttpOnly: true,
    isSameSite: 'Lax',
    ttl: milliseconds.fiveMinutes,
    encoding: 'none'
  }
}
