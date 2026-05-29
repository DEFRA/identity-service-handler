import Provider from 'oidc-provider'
import { config } from '../../../config/config.js'
import { loadPrivateKeyJwk } from '../../common/helpers/auth/certificate-tools.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import {
  onServerError,
  onInteractionError,
  onAuthorizationError
} from './provider-event-handlers.js'
import { get as getApplication } from '../application.js'

export function buildBrokerProvider() {
  const oidc = new Provider(
    config.get('idService.oidc.issuer'),
    buildBrokerConfiguration({
      cookiePassword: config.get('session.cookie.password'),
      sessionCookieSecure: config.get('session.cookie.secure'),
      jwks: loadPrivateKeyJwk()
    })
  )

  oidc.on('server_error', onServerError)
  oidc.on('interaction.error', onInteractionError)
  oidc.on('authorization.error', onAuthorizationError)

  oidc.Client.find = async (clientId) => {
    const clientConfiguration = await getApplication(clientId)
    return new oidc.Client(clientConfiguration)
  }

  return oidc
}
