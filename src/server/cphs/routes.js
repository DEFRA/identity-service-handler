import { listController } from './controllers/list-controller.js'
import {
  removeController,
  removeSubmitController
} from './controllers/remove-controller.js'

const sessionAuth = {
  auth: {
    mode: 'required',
    strategies: ['session']
  }
}

export const routes = () => [
  {
    method: 'GET',
    path: '/account/cphs',
    options: sessionAuth,
    ...listController
  },
  {
    method: 'GET',
    path: '/account/cphs/{delegation_id}/remove',
    options: sessionAuth,
    ...removeController
  },
  {
    method: 'POST',
    path: '/account/cphs/{delegation_id}/remove',
    options: sessionAuth,
    ...removeSubmitController
  }
]
