import { listController } from './controllers/list-controller.js'
import {
  createController,
  createSubmitController
} from './controllers/create-controller.js'
import {
  cphsController,
  cphsSubmitController
} from './controllers/cphs-controller.js'
import {
  deleteController,
  deleteSubmitController
} from './controllers/delete-controller.js'
import {
  manageController,
  manageUpdateController
} from './controllers/manage-controller.js'

const sessionAuth = {
  auth: {
    mode: 'required',
    strategies: ['session']
  }
}

export const routes = (options = {}) => {
  const {
    delegationPath = '/delegation',
    delegationService,
    userService
  } = options
  const createSubmit = createSubmitController()
  const cphsSubmit = cphsSubmitController(delegationService, userService)
  const manageUpdate = manageUpdateController(delegationService, userService)

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
      ...createSubmit,
      options: {
        ...createSubmit.options,
        ...sessionAuth
      }
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
      ...cphsSubmit,
      options: {
        ...cphsSubmit.options,
        ...sessionAuth
      }
    },
    {
      method: 'GET',
      options: sessionAuth,
      path: `${delegationPath}/{delegation_id}/manage`,
      ...manageController(delegationService, userService)
    },
    {
      method: 'POST',
      path: `${delegationPath}/{delegation_id}/manage`,
      ...manageUpdate,
      options: {
        ...manageUpdate.options,
        ...sessionAuth
      }
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
