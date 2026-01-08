import {
  selectionController,
  selectionControllerPost,
  detailsController,
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
          path: '/register/{service}',
          ...selectionController
        },
        {
          method: 'POST',
          path: '/register/{service}',
          ...selectionControllerPost
        },
        {
          method: 'GET',
          path: '/register/{service}/{usertype}',
          ...detailsController
        }
      ])
    }
  }
}
