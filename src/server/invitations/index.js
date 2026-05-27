import { routes } from './routes.js'

export const invitations = {
  plugin: {
    name: 'invitations',
    register: async (server) => {
      server.route(routes())
    }
  }
}
