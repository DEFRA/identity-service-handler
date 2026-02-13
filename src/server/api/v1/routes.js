import { contextController } from './controllers/context-controller.js'

export const routes = (options = {}) => {
  const { contextPath = '/context', userService } = options

  return [
    {
      method: 'GET',
      path: contextPath,
      ...contextController(userService),
      options: {
        ...(contextController.options ?? {}),
        auth: {
          strategy: 'bearer',
          mode: 'required'
        }
      }
    }
  ]
}
