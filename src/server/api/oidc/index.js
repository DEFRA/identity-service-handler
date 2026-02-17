import { routes } from './routes.js'

export const oidc = {
  plugin: {
    name: 'oidc-api',
    register(server, options = {}) {
      server.route(routes(options))
    }
  }
}
