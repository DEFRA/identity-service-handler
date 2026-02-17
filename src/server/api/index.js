import { health } from './health/index.js'
import { oidc } from './oidc/index.js'
import { v1 } from './v1/index.js'

export const api = {
  plugin: {
    name: 'api',
    register: async (server, options = {}) => {
      await server.register(health)
      await server.register(oidc)

      // Versioned business API surface
      await server.register({
        plugin: v1.plugin,
        options,
        routes: {
          prefix: '/api/v1'
        }
      })
    }
  }
}
