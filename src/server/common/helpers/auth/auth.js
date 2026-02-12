import { config } from '../../../../config/config.js'
import { jwtVerify, createRemoteJWKSet } from 'jose'

export const auth = {
  plugin: {
    name: 'auth',
    async register(server) {
      // Cookie auth
      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'brokersid',
          password: config.get('session.cookie.password'),
          isSecure: config.get('session.cookie.secure')
        },
        redirectTo: false,
        validate: async (req, session) => {
          if (!session?.sub) return { valid: false }
          return { valid: true, credentials: { sub: session.sub } }
        }
      })

      // JWT auth
      const jwks = createRemoteJWKSet(
        new URL(`${config.get('idService.handler.baseUrl')}/jwks`)
      )
      server.auth.scheme('bearer', () => ({
        authenticate: async (req, h) => {
          const auth = req.headers.authorization
          if (!auth?.startsWith('Bearer ')) throw h.unauthorized()
          const token = auth.slice('Bearer '.length)

          try {
            const { payload } = await jwtVerify(token, jwks, {
              // issuer: env.BROKER_ISSUER
            })
            if (!payload.sub) {
              throw new Error('Missing sub')
            }
            return h.authenticated({ credentials: { sub: payload.sub } })
          } catch {
            throw h.unauthorized()
          }
        }
      }))
      server.auth.strategy('bearer', 'bearer')
    }
  }
}
