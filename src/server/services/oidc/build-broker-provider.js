import Provider from 'oidc-provider'
import { config } from '../../../config/config.js'
import { loadPrivateKeyJwk } from '../../common/helpers/auth/certificate-tools.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { findClient } from './find-client.js'
import {
  onServerError,
  onInteractionError,
  onAuthorizationError
} from './provider-event-handlers.js'

export function buildBrokerProvider({ redis, clientsService, userService }) {
  const oidc = new Provider(
    config.get('idService.oidc.issuer'),
    buildBrokerConfiguration({
      cookiePassword: config.get('session.cookie.password'),
      sessionCookieSecure: config.get('session.cookie.secure'),
      redis,
      jwks: loadPrivateKeyJwk(),
      userService
    })
  )

  oidc.on('server_error', onServerError)
  oidc.on('interaction.error', onInteractionError)
  oidc.on('authorization.error', onAuthorizationError)

  // Dynamic client loading
  oidc.Client.find = (clientId) =>
    findClient(clientId, clientsService, oidc.Client)

  return oidc
}
