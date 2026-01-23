import { routes } from './routes.js'

export const wellKnown = {
  plugin: {
    name: 'wellKnown-api',
    register(server, options = {}) {
      server.route(routes(options))
    }
  }
}
