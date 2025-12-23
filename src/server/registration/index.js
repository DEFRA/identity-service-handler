import {
  registerController,
  registerCompleteController,
  reviewController
} from './controller.js'

export const registration = {
  plugin: {
    name: 'registration',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/config/{service}/{usertype}',
          ...reviewController
        },
        {
          method: 'GET',
          path: '/register/{service}/{usertype}',
          ...registerController
        },
        {
          method: 'POST',
          path: '/register/{service}/{usertype}',
          ...registerCompleteController
        }
      ])
    }
  }
}
