import Provider from 'oidc-provider'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { findClient } from './find-client.js'
import {
  onServerError,
  onInteractionError,
  onAuthorizationError
} from './provider-event-handlers.js'

export function buildBrokerProvider({
  cookiePassword,
  sessionCookieSecure,
  issuer,
  redis,
  clientsService,
  userService
}) {
  const oidc = new Provider(
    issuer,
    buildBrokerConfiguration({
      cookiePassword,
      sessionCookieSecure,
      redis,
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
