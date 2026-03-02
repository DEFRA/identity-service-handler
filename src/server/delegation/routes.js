import { listController } from './controllers/list-controller.js'
import {
  createController,
  createSubmitController
} from './controllers/create-controller.js'
import {
  speciesController,
  speciesSubmitController
} from './controllers/species-controller.js'
import {
  cphsController,
  cphsSubmitController
} from './controllers/cphs-controller.js'
import {
  deleteController,
  deleteSubmitController
} from './controllers/delete-controller.js'

const sessionAuth = {
  auth: {
    mode: 'required',
    strategies: ['session']
  }
}

export const routes = (options = {}) => {
  const { delegationPath = '/delegation', delegationService, userService } = options
  return [
    {
      method: 'GET',
      path: delegationPath,
      options: sessionAuth,
      ...listController(delegationService)
    },
    {
      method: 'GET',
      path: `${delegationPath}/create`,
      options: sessionAuth,
      ...createController()
    },
    {
      method: 'POST',
      path: `${delegationPath}/create`,
      options: sessionAuth,
      ...createSubmitController()
    },
    {
      method: 'GET',
      path: `${delegationPath}/create/species`,
      options: sessionAuth,
      ...speciesController()
    },
    {
      method: 'POST',
      path: `${delegationPath}/create/species`,
      options: sessionAuth,
      ...speciesSubmitController()
    },
    {
      method: 'GET',
      path: `${delegationPath}/create/cphs`,
      options: sessionAuth,
      ...cphsController(userService)
    },
    {
      method: 'POST',
      path: `${delegationPath}/create/cphs`,
      options: sessionAuth,
      ...cphsSubmitController(delegationService, userService)
    },
    {
      method: 'GET',
      options: sessionAuth,
      path: `${delegationPath}/{delegateId}/delete`,
      ...deleteController(delegationService)
    },
    {
      method: 'POST',
      options: sessionAuth,
      path: `${delegationPath}/{delegateId}/delete`,
      ...deleteSubmitController(delegationService)
    }
  ]
}
