import { config } from '../../../config/config.js'

export function createOidcFakeApiClient() {
  return {
    oidcDetails: async () => oidcDetails()
  }
}

async function oidcDetails() {
  return {
    issuer: config.get('idService.defraCiEndpoint'),
    authorization_endpoint: 'token.authorization_endpoint',
    token_endpoint: 'token.token_endpoint',
    end_session_endpoint: 'token.end_session_endpoint',
    jwks_uri: 'token.jwks_uri'
  }
}
