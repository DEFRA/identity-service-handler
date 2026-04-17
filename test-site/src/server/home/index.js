import {
  homeController,
  loginController,
  loginCallbackController,
  refreshTokenController,
  getContextController,
  signoutController
} from './controller.js'

/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const home = {
  plugin: {
    name: 'home',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/{success?}',
          ...homeController
        },
        {
          method: ['GET', 'POST'],
          path: '/login',
          ...loginController
        },
        {
          method: 'GET',
          path: '/callback',
          ...loginCallbackController
        },
        {
          method: ['GET', 'POST'],
          path: '/context',
          ...getContextController
        },
        {
          method: ['GET', 'POST'],
          path: '/refresh',
          ...refreshTokenController
        },
        {
          method: ['GET', 'POST'],
          path: '/signout',
          ...signoutController
        }
      ])
    }
  }
}
