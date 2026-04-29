import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'
import { seconds } from '../../common/helpers/duration.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { config } from '../../../config/config.js'
import { randomUUID } from 'node:crypto'

export function create({ b2cConfiguration, upstreamStateStore }) {
  return async function (request, h) {
    const nextUrl = request.query.next

    if (!nextUrl?.startsWith('/') || nextUrl.startsWith('//')) {
      return h.response('Invalid next parameter').code(statusCodes.badRequest)
    }

    const pkceCodeVerifier = randomPKCECodeVerifier()
    const pkceCodeChallenge = await calculatePKCECodeChallenge(pkceCodeVerifier)
    const uid = randomUUID()
    const state = randomState()
    const nonce = randomNonce()
    await upstreamStateStore.put(
      state,
      { uid, nonce, pkceCodeVerifier, nextUrl },
      seconds.tenMinutes
    )

    // Build authorize URL and redirect the user to B2C (hosted UI)
    return h.redirect(
      buildAuthorizationUrl(b2cConfiguration, {
        redirect_uri: config.get('idService.b2c.redirectUrl'),
        scope: `openid offline_access ${config.get('idService.b2c.clientId')}`,
        state,
        nonce,
        response_mode: 'query',
        code_challenge: pkceCodeChallenge,
        code_challenge_method: 'S256',
        serviceId: config.get('idService.b2c.serviceId')
      }).href
    )
  }
}
