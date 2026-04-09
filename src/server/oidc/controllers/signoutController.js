import { SIGNOUT_REDIRECT_COOKIE_NAME } from '../constants.js'
import { milliseconds } from '../../common/helpers/duration.js'

const OIDC_SIGNOUT_PARAM_NAMES = [
  'id_token_hint',
  'client_id',
  'state',
  'ui_locales',
  'logout_hint'
]

export function create({ config, b2cConfiguration }) {
  return async function (request, h) {
    request.cookieAuth.clear()

    const brokerSignoutUrl = buildBrokerSignoutUrl(
      config.get('idService.handler.baseUrl'),
      request.query
    )
    const postLogoutRedirectUri = resolvePostLogoutRedirectUri(request)
    const signoutUrl = buildUpstreamSignoutUrl(
      b2cConfiguration,
      brokerSignoutUrl.href,
      request
    )

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

function buildBrokerSignoutUrl(baseUrl, query) {
  const url = new URL('oidc/signout', baseUrl)
  for (const paramName of OIDC_SIGNOUT_PARAM_NAMES) {
    const value = query?.[paramName]
    if (typeof value === 'string' && value.trim()) {
      url.searchParams.set(paramName, value.trim())
    }
  }
  return url
}

function buildUpstreamSignoutUrl(b2cConfiguration, brokerSignoutUrl, request) {
  const upstreamEndSessionEndpoint = getEndSessionEndpoint(b2cConfiguration)

  if (!upstreamEndSessionEndpoint) {
    return new URL(brokerSignoutUrl)
  }

  const url = new URL(upstreamEndSessionEndpoint)
  url.searchParams.set('post_logout_redirect_uri', brokerSignoutUrl)
  const idTokenHint = resolveUpstreamIdTokenHint(request)
  if (typeof idTokenHint === 'string' && idTokenHint.trim()) {
    url.searchParams.set('id_token_hint', idTokenHint.trim())
  }
  return url
}

function resolveUpstreamIdTokenHint(request) {
  const requestedIdTokenHint = request?.query?.id_token_hint
  if (typeof requestedIdTokenHint === 'string' && requestedIdTokenHint.trim()) {
    return requestedIdTokenHint
  }

  const sessionIdTokenHint = request?.auth?.credentials?.upstreamIdTokenHint
  if (typeof sessionIdTokenHint === 'string' && sessionIdTokenHint.trim()) {
    return sessionIdTokenHint
  }

  const yarIdTokenHint = request?.yar?.get?.('upstreamIdTokenHint')
  if (typeof yarIdTokenHint === 'string' && yarIdTokenHint.trim()) {
    return yarIdTokenHint
  }

  return undefined
}

function getEndSessionEndpoint(b2cConfiguration) {
  const metadata =
    typeof b2cConfiguration?.serverMetadata === 'function'
      ? b2cConfiguration.serverMetadata()
      : b2cConfiguration

  if (
    typeof metadata?.end_session_endpoint !== 'string' ||
    !metadata.end_session_endpoint.trim()
  ) {
    return undefined
  }

  return metadata.end_session_endpoint
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
