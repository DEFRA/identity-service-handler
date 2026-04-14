import * as oidc from 'openid-client'
import jwt from 'jsonwebtoken'
import { statusCodes } from '../../common/constants/status-codes.js'
import { seconds } from '../../common/helpers/duration.js'

export function create({
  config,
  b2cConfiguration,
  subjectsService,
  upstreamStateStore
}) {
  return async function (request, h) {
    const { code, state } =
      (request.method === 'post' ? request.payload : request.query) ?? {}

    if (!code) {
      return h.response('Missing code').code(statusCodes.badRequest)
    }
    if (!state) {
      return h.response('Missing state').code(statusCodes.badRequest)
    }

    const record = await upstreamStateStore.get(state)
    if (!record) {
      return h.response('Unknown/expired state').code(statusCodes.badRequest)
    }

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
    const { iss, sub, email, firstName, lastName } = jwt.decode(tokens.id_token)

    // Map upstream (iss, sub) to broker sub
    const { sub: brokerSub } = await subjectsService.getOrCreateBrokerSub(
      iss,
      sub,
      email
    )

    // Set broker SSO cookie
    request.cookieAuth.set({
      sub: brokerSub,
      firstName,
      lastName,
      email
    })

    // Persist resolved login by interaction UID so /interaction/{uid} can finish
    // even if browser cookie persistence is unreliable in local cross-domain hops.
    await upstreamStateStore.putByUid(uid, { brokerSub }, seconds.twoMinutes)

    await upstreamStateStore.del(state)

    return h.redirect(`/interaction/${uid}`)
  }
}
