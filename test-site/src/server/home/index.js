import {
  homeController,
  loginController,
  loginCallbackController,
  getContextController,
  refreshController,
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
          path: '/',
          ...homeController
        },
        {
          method: 'GET',
          path: '/login',
          ...loginController
        },
        {
          method: 'GET',
          path: '/callback',
          ...loginCallbackController
        },
        {
          method: 'GET',
          path: '/context',
          ...getContextController
        },
        {
          method: 'GET',
          path: '/refresh',
          ...refreshController
        },
        {
          method: 'GET',
          path: '/signout',
          ...signoutController
        }
      ])
    }
  }
}
