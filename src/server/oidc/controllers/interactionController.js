import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'
import { buildGrantFromInteraction } from './helpers/build-grant-from-interaction.js'

export function create({
  config,
  b2cConfiguration,
  brokerProvider,
  upstreamStateStore
}) {
  return async (request, h) => {
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
      const grant = await buildGrantFromInteraction(brokerProvider, interaction)

      const result = { consent: {} }
      if (interaction.grantId) {
        await grant.save()
      } else {
        result.consent.grantId = await grant.save()
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
    const pkceCodeVerifier = randomPKCECodeVerifier()
    const pkceCodeChallenge = await calculatePKCECodeChallenge(pkceCodeVerifier)

    const state = randomState()

    // (OIDC) nonce is still useful for id_token replay protection
    const nonce = randomNonce()

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
    const redirectTo = buildAuthorizationUrl(b2cConfiguration, parameters)
    return h.redirect(redirectTo.href)
  }
}
