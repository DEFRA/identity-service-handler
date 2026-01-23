import { routes } from './routes.js'

export const auth = {
  plugin: {
    name: 'auth-api',
    register(server, options = {}) {
      server.route(routes(options))
    }
  }
}
