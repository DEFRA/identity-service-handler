import { config } from '../../../../config/config.js'

export const oidcDiscoveryController = {
  handler: (request, h) => {
    const idConfig = config.get('idService')
    const baseUrl = idConfig.identityServiceBaseUrl.replace(/\/$/, '')

    return h
      .response({
        issuer: `${baseUrl}`,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        jwks_uri: `${baseUrl}/jwks`,
        userinfo_endpoint: `${baseUrl}/userinfo`,

        response_types_supported: ['code', 'id_token'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        subject_types_supported: ['pairwise'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email'],
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'private_key_jwt'
        ],
        claims_supported: [
          'sub',
          'iss',
          'auth_time',
          'name',
          'given_name',
          'family_name',
          'email'
        ],

        end_session_endpoint: `${baseUrl}/signout`
      })
      .type('application/json')
  }
}
