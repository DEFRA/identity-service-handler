import { contextController } from './controllers/context-controller.js'

export const routes = (options = {}) => {
  const { contextPath = '/context', redis } = options

  return [
    {
      method: 'GET',
      path: contextPath,
      ...contextController(redis),
      options: {
        ...contextController.options,
        auth: {
          strategy: 'bearer',
          mode: 'required'
        }
      }
    }
  ]
}
