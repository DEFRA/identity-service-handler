import { listController } from './controllers/list-controller.js'
import {
  createController,
  createSubmitController
} from './controllers/create-controller.js'

export const routes = (options = {}) => {
  const { delegationPath = '/delegation', delegationService } = options
  return [
    {
      method: 'GET',
      path: delegationPath,
      options: {
        auth: {
          mode: 'required',
          strategies: ['session']
        }
      },
      ...listController(delegationService)
    },
    {
      method: 'GET',
      path: `${delegationPath}/create`,
      options: {
        auth: {
          mode: 'required',
          strategies: ['session']
        }
      },
      ...createController()
    },
    {
      method: 'POST',
      path: `${delegationPath}/create`,
      options: {
        auth: {
          mode: 'required',
          strategies: ['session']
        }
      },
      ...createSubmitController(delegationService)
    }
  ]
}
