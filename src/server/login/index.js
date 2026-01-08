import {
  loginController,
  logoutController,
  callbackController,
  loginServiceController,
  yourAccountController
} from './controller.js'

export const login = {
  plugin: {
    name: 'login',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/',
          ...loginController
        },
        {
          method: 'GET',
          path: '/login',
          ...loginController
        },
        {
          method: 'GET',
          path: '/login/{service}/{usertype}',
          ...loginServiceController
        },
        {
          method: 'POST',
          path: '/sso',
          ...callbackController
        },
        {
          method: 'GET',
          path: '/signout',
          ...logoutController
        },
        {
          method: 'GET',
          path: '/your-defra-account',
          ...yourAccountController
        }
      ])
    }
  }
}
