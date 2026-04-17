import { statusCodes } from '../../../common/constants/status-codes.js'
import { config } from '../../../../config/config.js'

export const oidcController = {
  handler(_request, h) {
    const baseUrl = new URL(config.get('idService.handler.baseUrl'))

    return h
      .response({
        authorization_endpoint: new URL('authorize', baseUrl).href,
        end_session_endpoint: new URL('signout', baseUrl).href,
        token_endpoint: new URL('token', baseUrl).href,
        pushed_authorization_request_endpoint: new URL('request', baseUrl).href,
        userinfo_endpoint: new URL('userinfo', baseUrl).href,
        claims_parameter_supported: false,
        claims_supported: [
          'sub',
          'email',
          'given_name',
          'family_name',
          'display_name',
          'primary_cph',
          'delegated_cph',
          'iss'
        ],
        code_challenge_methods_supported: ['S256'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        issuer: 'https://identity-service-handler.defra.gov.uk',
        authorization_response_iss_parameter_supported: true,
        response_modes_supported: ['form_post', 'fragment', 'query'],
        response_types_supported: ['code'],
        scopes_supported: ['openid', 'offline_access', 'profile', 'email'],
        subject_types_supported: ['public'],
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        token_endpoint_auth_signing_alg_values_supported: [
          'HS256',
          'RS256',
          'PS256',
          'ES256',
          'Ed25519',
          'EdDSA'
        ],
        id_token_signing_alg_values_supported: ['RS256'],
        request_uri_parameter_supported: false,
        dpop_signing_alg_values_supported: ['ES256', 'Ed25519', 'EdDSA'],
        claim_types_supported: ['normal']
      })
      .code(statusCodes.ok)
  }
}
