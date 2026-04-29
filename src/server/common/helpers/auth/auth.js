import { config } from '../../../../config/config.js'
import { createRemoteJWKSet } from 'jose'
import { validateSession } from './validate-session.js'
import { authenticateBearer } from './authenticate-bearer.js'
import { onCredentials } from './on-credentials.js'

export const auth = {
  plugin: {
    name: 'auth',
    async register(server, options = {}) {
      const jwks = createRemoteJWKSet(
        new URL(`${config.get('idService.handler.baseUrl')}/jwks`)
      )
      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'brokersid',
          password: config.get('session.cookie.password'),
          isSecure: config.get('session.cookie.secure'),
          isSameSite: 'Lax'
        },
        redirectTo: false,
        validate: validateSession
      })
      server.auth.scheme('bearer', () => ({
        authenticate: (req, h) =>
          authenticateBearer(req, h, jwks, options.brokerProvider)
      }))
      server.auth.strategy('bearer', 'bearer')
      server.ext('onCredentials', onCredentials)
    }
  }
}
