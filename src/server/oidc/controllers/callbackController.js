import * as oidc from 'openid-client'
import jwt from 'jsonwebtoken'

export function create({
  config,
  b2cConfiguration,
  brokerProvider,
  subjectsService,
  upstreamStateStore
}) {
  return async function (request, h) {
    const params =
      request.method === 'post'
        ? (request.payload ?? {})
        : (request.query ?? {})

    const code = params.code
    const state = params.state

    if (!code) return h.response('Missing code').code(400)
    if (!state) return h.response('Missing state').code(400)

    const record = await upstreamStateStore.get(state)
    if (!record) return h.response('Unknown/expired state').code(400)

    const { uid, nonce, pkceCodeVerifier } = record

    const callbackUrl = new URL(config.get('idService.b2c.redirectUrl'))
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('state', state)
    callbackUrl.searchParams.set(
      'scope',
      `openid offline_access ${config.get('idService.b2c.clientId')}`
    )

    // This performs the code exchange and validates expected state, PKCE, etc.
    const tokens = await oidc.authorizationCodeGrant(
      b2cConfiguration,
      callbackUrl,
      {
        pkceCodeVerifier,
        expectedState: state,
        expectedNonce: nonce
      }
    )

    // Validate the ID Token and its nonce (OIDC step)
    const claims = jwt.decode(tokens.id_token)

    // Map upstream (iss, sub) to broker sub
    const brokerSub = await subjectsService.getOrCreateBrokerSub(
      claims.iss,
      claims.sub
    )

    // Set broker SSO cookie
    request.cookieAuth.set({
      sub: brokerSub,
      firstName: claims.firstName,
      lastName: claims.lastName,
      email: claims.email
    })

    // Persist resolved login by interaction UID so /interaction/{uid} can finish
    // even if browser cookie persistence is unreliable in local cross-domain hops.
    await upstreamStateStore.putByUid(uid, { brokerSub }, 120)

    await upstreamStateStore.del(state)

    return h.redirect(`/interaction/${uid}`)
  }
}
