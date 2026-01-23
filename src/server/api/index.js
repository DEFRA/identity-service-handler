import { auth } from './auth/index.js'
import { health } from './health/index.js'
import { wellKnown } from './well-known/index.js'
import { v1 } from './v1/index.js'

export const api = {
  plugin: {
    name: 'api',
    register: async (server) => {
      // Unversioned operational endpoint(s)
      await server.register(auth)
      await server.register(health)

      // Unversioned protocol endpoints (e.g. /.well-known/*)
      await server.register(wellKnown)

      // Versioned business API surface
      await server.register(v1, {
        routes: {
          prefix: '/api/v1'
        }
      })
    }
  }
}
