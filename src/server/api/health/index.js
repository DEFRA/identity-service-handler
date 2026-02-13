import { routes } from './routes.js'

export const health = {
  plugin: {
    name: 'health-api',
    register(server, options = {}) {
      server.route(routes(options))
    }
  }
}
