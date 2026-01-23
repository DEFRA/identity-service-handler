import Boom from 'boom'
import HapiAuthJwt2 from 'hapi-auth-jwt2'
import { config } from '../../../../config/config.js'

export const auth = {
  plugin: {
    name: 'auth',
    async register(server) {
      // --- Session auth (via @hapi/yar) ---
      server.auth.scheme('session-cookie', () => {
        return {
          authenticate(request, h) {
            const sessionUser = request.yar?.get('user')
            if (!sessionUser) {
              throw Boom.unauthorized('Missing session')
            }

            const tokens = request.yar?.get('tokens') || null

            return h.authenticated({
              credentials: {
                type: 'session',
                user: sessionUser,
                tokens
              }
            })
          }
        }
      })

      server.auth.strategy('session', 'session-cookie')

      // --- JWT auth (via Authorization header Bearer <token>) ---
      await server.register(HapiAuthJwt2)

      server.auth.strategy('jwt', 'jwt', {
        key: config.get('idService.jwtSecret'),
        tokenType: 'Bearer',
        validate: async (decoded, request, h) => {
          // Put any extra checks here if you want:
          // - decoded.scopes includes something
          // - decoded.role, decoded.service etc
          return {
            isValid: true,
            credentials: {
              type: 'jwt',
              ...decoded
            }
          }
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: config.get('idService.oidcIssuer'),
          audience: config.get('idService.oidcAudience')
        }
      })
    }
  }
}
