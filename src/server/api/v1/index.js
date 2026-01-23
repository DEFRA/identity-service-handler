import { routes } from './routes.js'

export const v1 = {
  plugin: {
    name: 'v1-api',
    register(server, options = {}) {
      server.route(routes(options))
    }
  }
}
