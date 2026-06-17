import { accountController } from './controllers/account-controller.js'

const sessionAuth = {
  auth: {
    mode: 'required',
    strategies: ['session']
  }
}

export const routes = () => [
  {
    method: 'GET',
    path: '/account',
    options: sessionAuth,
    ...accountController
  }
]
