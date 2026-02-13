import * as oidc from 'openid-client'

export function create({
  config,
  b2cConfiguration,
  brokerProvider,
  upstreamStateStore
}) {
  return async function (request, h) {
    const { uid } = request.params
    const b2cConfig = config.get('idService.b2c')
    const interaction = await brokerProvider.interactionDetails(
      request.raw.req,
      request.raw.res
    )
    const promptName = interaction?.prompt?.name

    const pendingLogin = await upstreamStateStore.getByUid(uid)
    if (pendingLogin?.brokerSub) {
      await upstreamStateStore.delByUid(uid)
      const result = { login: { accountId: pendingLogin.brokerSub } }
      await brokerProvider.interactionFinished(
        request.raw.req,
        request.raw.res,
        result,
        { mergeWithLastSubmission: false }
      )
      return h.abandon
    }

    if (promptName === 'consent') {
      const { prompt, params, session, grantId } = interaction
      const details = prompt?.details ?? {}

      let grant
      if (grantId) {
        grant = await brokerProvider.Grant.find(grantId)
      } else {
        grant = new brokerProvider.Grant({
          accountId: session?.accountId,
          clientId: params?.client_id
        })
      }

      const missingOIDCScope = details.missingOIDCScope
      if (Array.isArray(missingOIDCScope) && missingOIDCScope.length) {
        grant.addOIDCScope(missingOIDCScope.join(' '))
      }

      const missingOIDCClaims = details.missingOIDCClaims
      if (Array.isArray(missingOIDCClaims) && missingOIDCClaims.length) {
        grant.addOIDCClaims(missingOIDCClaims)
      }

      const missingResourceScopes = details.missingResourceScopes
      if (missingResourceScopes && typeof missingResourceScopes === 'object') {
        for (const [indicator, scopes] of Object.entries(
          missingResourceScopes
        )) {
          if (Array.isArray(scopes) && scopes.length) {
            grant.addResourceScope(indicator, scopes.join(' '))
          }
        }
      }

      const result = { consent: {} }
      if (!grantId) {
        result.consent.grantId = await grant.save()
      } else {
        await grant.save()
      }

      await brokerProvider.interactionFinished(
        request.raw.req,
        request.raw.res,
        result,
        { mergeWithLastSubmission: true }
      )
      return h.abandon
    }

    if (request.auth.isAuthenticated) {
      const result = { login: { accountId: request.auth.credentials.sub } }
      await brokerProvider.interactionFinished(
        request.raw.req,
        request.raw.res,
        result,
        { mergeWithLastSubmission: false }
      )
      return h.abandon
    }

    const redirectUri = b2cConfig.redirectUrl
    const scope = `openid offline_access ${b2cConfig.clientId}`

    // (recommended) PKCE + state
    const pkceCodeVerifier = oidc.randomPKCECodeVerifier()
    const pkceCodeChallenge =
      await oidc.calculatePKCECodeChallenge(pkceCodeVerifier)

    const state = oidc.randomState()

    // (OIDC) nonce is still useful for id_token replay protection
    const nonce = oidc.randomNonce()

    // store correlation for callback
    await upstreamStateStore.put(state, { uid, nonce, pkceCodeVerifier }, 600)

    const parameters = {
      redirect_uri: redirectUri,
      scope,
      state,
      nonce,
      response_mode: 'query',
      code_challenge: pkceCodeChallenge,
      code_challenge_method: 'S256',
      serviceId: b2cConfig.serviceId
    }

    // Build authorize URL and redirect the user to B2C (hosted UI)
    const redirectTo = oidc.buildAuthorizationUrl(b2cConfiguration, parameters)
    return h.redirect(redirectTo.href)
  }
}
