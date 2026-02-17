import { oidcController } from './controllers/oidc-controller.js'

export const routes = (options = {}) => {
  const { oidcPath = '/.well-known/openid-configuration' } = options

  return [
    {
      method: 'GET',
      path: oidcPath,
      ...oidcController
    }
  ]
}
