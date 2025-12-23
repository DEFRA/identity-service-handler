import {
  loginController,
  logoutController,
  callbackController,
  callback2Controller,
  resetController,
  sessionInfoController,
  loginServiceController
} from './controller.js'

export const login = {
  plugin: {
    name: 'login',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/reset',
          // options: { auth: false },
          ...resetController
        },
        {
          method: 'GET',
          path: '/session-info',
          // options: { auth: false },
          ...sessionInfoController
        },
        {
          method: 'GET',
          path: '/login',
          // options: { auth: false },
          ...loginController
        },
        {
          method: 'GET',
          path: '/login/{service}/{usertype}',
          ...loginServiceController
        },
        {
          method: 'POST',
          path: '/callback',
          // options: { auth: false },
          ...callbackController
        },
        {
          method: 'POST',
          path: '/callback2',
          // options: { auth: false },
          ...callback2Controller
        },
        {
          method: 'GET',
          path: '/sign-out',
          ...logoutController
        },
        {
          method: 'GET',
          path: '/your-defra-account',
          // options: { auth: false },
          handler: (_request, h) => {
            return h.view('login/your-defra-account')
          }
        }
      ])
    }
  }
}
