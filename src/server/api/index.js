import { apiController } from './controller.js'

export const api = {
  plugin: {
    name: 'api',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/api/delegate-list/{listId}',
          ...apiController
        }
      ])
    }
  }
}
