import { config } from '../../config/config.js'
import Wreck from '@hapi/wreck'

export async function defraOicdDetails() {
  const defraCiDiscoveryUrl =
    config.get('idService.defraCiEndpoint') +
    '/.well-known/openid-configuration'

  const res = (await Wreck.get(defraCiDiscoveryUrl)) || {}
  const token = JSON.parse(res.payload.toString())

  return {
    issuer: token.issuer,
    authorization_endpoint: token.authorization_endpoint,
    token_endpoint: token.token_endpoint,
    end_session_endpoint: token.end_session_endpoint,
    jwks_uri: token.jwks_uri
  }
}
