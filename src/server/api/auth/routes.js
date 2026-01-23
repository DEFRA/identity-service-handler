import { authController } from './controllers/auth-controller.js'
import { tokenController } from './controllers/token-controller.js'
import { tokenExchangeController } from './controllers/token-exchange-controller.js'
import { logoutController } from './controllers/logout-controller.js'

export const routes = (options = {}) => {
  const {
    authPath = '/authorize',
    authCallbackPath = '/sso',
    signPutPath: signOutPath = '/signout',
    tokenPath = '/token'
  } = options

  return [
    {
      method: 'POST',
      path: authPath,
      ...authController,
      options: {
        ...(authController.options ?? {}),
        auth: false
      }
    },
    {
      method: 'GET',
      path: authPath,
      ...authController,
      options: {
        ...(authController.options ?? {}),
        auth: false
      }
    },
    {
      method: 'POST',
      path: tokenPath,
      ...tokenController,
      options: {
        ...(tokenController.options ?? {}),
        auth: {
          strategy: 'session',
          mode: 'required'
        }
      }
    },
    {
      method: 'POST',
      path: authCallbackPath,
      ...tokenExchangeController,
      options: {
        ...(tokenExchangeController.options ?? {}),
        auth: false
      }
    },
    {
      method: 'GET',
      path: signOutPath,
      ...logoutController,
      options: {
        ...(logoutController.options ?? {}),
        auth: false
      }
    }
  ]
}
