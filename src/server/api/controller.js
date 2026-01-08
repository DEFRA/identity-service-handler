import { identityHelperServiceApiClient } from '../services/id-helper-service.js'
import { config } from '../../config/config.js'
import fs from 'node:fs'
import crypto from 'node:crypto'

export const apiController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    const userPayload =
      await identityHelperServiceApiClient.getUserRegistrations(
        request,
        user.email
      )
    if (!userPayload) {
      throw new Error('API did not return service information')
    }

    const selectedRole = userPayload.registeredRoles.find((x) =>
      x.cphs.some((y) => y.delegateId === request.params.listId)
    )

    const tmp = {
      delegatedId: selectedRole?.delegatedId,
      cphs: selectedRole.cphs.map((x) => x.key) || []
    }
    return tmp
  }
}

export const oidcDiscoveryController = {
  handler: (request, h) => {
    const idConfig = config.get('idService')
    const baseUrl = idConfig.identityServiceBaseUrl.replace(/\/$/, '')

    return h
      .response({
        issuer: idConfig.oidcIssuer,
        authorization_endpoint: `${baseUrl}/login`,
        end_session_endpoint: `${baseUrl}/signout`,
        jwks_uri: `${baseUrl}/.well-known/jwks.json`,
        response_types_supported: ['code', 'id_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email'],
        token_endpoint_auth_methods_supported: [
          'client_secret_post',
          'client_secret_basic'
        ],
        claims_supported: [
          'sub',
          'iss',
          'auth_time',
          'name',
          'given_name',
          'family_name',
          'email'
        ]
      })
      .type('application/json')
  }
}

export const jwksController = {
  handler: (request, h) => {
    try {
      const certPath = config.get('tls.cert')
      const cert = fs.readFileSync(certPath, 'utf8')
      const publicKey = crypto.createPublicKey(cert)
      const jwk = publicKey.export({ format: 'jwk' })

      const certThumbprint = crypto
        .createHash('sha256')
        .update(
          Buffer.from(
            cert.replace(
              /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g,
              ''
            ),
            'base64'
          )
        )
        .digest('base64url')

      const response = {
        keys: [
          {
            ...jwk,
            use: 'sig',
            alg: 'RS256',
            kid: certThumbprint
          }
        ]
      }

      return h.response(response).type('application/json')
    } catch (err) {
      request.log('error', `Failed to generate JWKS: ${err.message}`)
      return h.response({ error: 'Internal Server Error' }).code(500)
    }
  }
}
