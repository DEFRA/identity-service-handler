import { healthController } from './controllers/health-controller.js'

export const routes = (options = {}) => {
  const { healthPath = '/.health' } = options

  return [
    {
      method: 'GET',
      path: healthPath,
      ...healthController
    }
  ]
}
