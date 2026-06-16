import { routes } from './routes.js'

export const cphs = {
  plugin: {
    name: 'cphs',
    register: async (server) => {
      server.route(routes())
    }
  }
}
