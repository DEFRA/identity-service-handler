import { health } from './health/index.js'
import { v1 } from './v1/index.js'

export const api = {
  plugin: {
    name: 'api',
    register: async (server) => {
      // Unversioned operational endpoint(s)
      await server.register(health)

      // Versioned business API surface
      await server.register(v1, {
        routes: {
          prefix: '/api/v1'
        }
      })
    }
  }
}
