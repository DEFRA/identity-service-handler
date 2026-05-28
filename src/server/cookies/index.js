import { cookiesController } from './controllers/cookies-controller.js'

export const cookies = {
  plugin: {
    name: 'cookies',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/cookies',
          options: { auth: false },
          ...cookiesController
        }
      ])
    }
  }
}
