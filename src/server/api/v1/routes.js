import { contextController } from './controllers/context-controller.js'

export const routes = (options = {}) => {
  const { contextPath = '/context' } = options

  return [
    {
      method: 'GET',
      path: contextPath,
      ...contextController,
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
