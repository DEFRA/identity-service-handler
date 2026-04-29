import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'
import { buildGrantFromInteraction } from './helpers/build-grant-from-interaction.js'
import { seconds } from '../../common/helpers/duration.js'

export function create({
  config,
  b2cConfiguration,
  brokerProvider,
  upstreamStateStore
}) {
  return (request, h) =>
    handleInteraction(request, h, {
      config,
      b2cConfiguration,
      brokerProvider,
      upstreamStateStore
    })
}

async function handleInteraction(
  request,
  h,
  { config, b2cConfiguration, brokerProvider, upstreamStateStore }
) {
  const { uid } = request.params
  const { req, res } = request.raw
  const b2cConfig = config.get('idService.b2c')
  const interaction = await brokerProvider.interactionDetails(req, res)
  const pendingLogin = await upstreamStateStore.getByUid(uid)
  if (pendingLogin?.brokerSub) {
    await upstreamStateStore.delByUid(uid)
    const result = { login: { accountId: pendingLogin.brokerSub } }
    await brokerProvider.interactionFinished(req, res, result, {
      mergeWithLastSubmission: false
    })
    return h.abandon
  }

  if (interaction?.prompt?.name === 'consent') {
    const grant = await buildGrantFromInteraction(brokerProvider, interaction)

    const result = { consent: {} }
    if (interaction.grantId) {
      await grant.save()
    } else {
      result.consent.grantId = await grant.save()
    }

    await brokerProvider.interactionFinished(req, res, result, {
      mergeWithLastSubmission: true
    })
    return h.abandon
  }

  if (request.auth.isAuthenticated) {
    const result = { login: { accountId: request.auth.credentials.sub } }
    await brokerProvider.interactionFinished(req, res, result, {
      mergeWithLastSubmission: false
    })
    return h.abandon
  }

  const scope = `openid offline_access ${b2cConfig.clientId}`

  // (recommended) PKCE + state
  const pkceCodeVerifier = randomPKCECodeVerifier()
  const pkceCodeChallenge = await calculatePKCECodeChallenge(pkceCodeVerifier)

  const state = randomState()
  // (OIDC) nonce is still useful for id_token replay protection
  const nonce = randomNonce()

  // store correlation for callback
  await upstreamStateStore.put(
    state,
    { uid, nonce, pkceCodeVerifier, nextUrl: `/interaction/${uid}` },
    seconds.tenMinutes
  )

  // Build authorize URL and redirect the user to B2C (hosted UI)
  return h.redirect(
    buildAuthorizationUrl(b2cConfiguration, {
      redirect_uri: b2cConfig.redirectUrl,
      scope,
      state,
      nonce,
      response_mode: 'query',
      code_challenge: pkceCodeChallenge,
      code_challenge_method: 'S256',
      serviceId: b2cConfig.serviceId
    }).href
  )
}
