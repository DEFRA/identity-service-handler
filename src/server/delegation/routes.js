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
  confirmController,
  confirmSubmitController
} from './controllers/confirm-controller.js'
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
  const { delegationPath = '/delegation' } = options
  return [
    {
      method: 'GET',
      path: delegationPath,
      options: sessionAuth,
      ...listController
    },
    ...createFlowRoutes(delegationPath),
    ...managementRoutes(delegationPath)
  ]
}

function createFlowRoutes(delegationPath) {
  return [
    {
      method: 'GET',
      path: `${delegationPath}/create`,
      options: sessionAuth,
      ...createController
    },
    {
      method: 'POST',
      path: `${delegationPath}/create`,
      ...createSubmitController,
      options: {
        ...createSubmitController.options,
        ...sessionAuth
      }
    },
    {
      method: 'GET',
      path: `${delegationPath}/create/cphs`,
      options: sessionAuth,
      ...cphsController
    },
    {
      method: 'POST',
      path: `${delegationPath}/create/cphs`,
      ...cphsSubmitController,
      options: {
        ...cphsSubmitController.options,
        ...sessionAuth
      }
    },
    {
      method: 'GET',
      path: `${delegationPath}/create/confirm`,
      options: sessionAuth,
      ...confirmController
    },
    {
      method: 'POST',
      options: sessionAuth,
      path: `${delegationPath}/create/confirm`,
      ...confirmSubmitController
    }
  ]
}

function managementRoutes(delegationPath) {
  return [
    {
      method: 'GET',
      options: sessionAuth,
      path: `${delegationPath}/{delegated_user_id}/manage`,
      ...manageController
    },
    {
      method: 'POST',
      path: `${delegationPath}/{delegated_user_id}/manage`,
      ...manageUpdateController,
      options: {
        ...manageUpdateController.options,
        ...sessionAuth
      }
    },
    {
      method: 'GET',
      options: sessionAuth,
      path: `${delegationPath}/{delegated_user_id}/delete`,
      ...deleteController
    },
    {
      method: 'POST',
      options: sessionAuth,
      path: `${delegationPath}/{delegated_user_id}/delete`,
      ...deleteSubmitController
    }
  ]
}
