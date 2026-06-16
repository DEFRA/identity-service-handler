import { routes } from './routes.js'

export const account = {
  plugin: {
    name: 'account',
    register: async (server) => {
      server.route(routes())
    }
  }
}
