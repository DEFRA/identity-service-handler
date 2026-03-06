import { routes } from './routes.js'

export const delegation = {
  plugin: {
    name: 'delegation',
    register: async (server, options = {}) => {
      server.route(routes(options))
    }
  }
}
