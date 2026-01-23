import { oidcDiscoveryController } from './controllers/oidc-discovery-controller.js'
import { jwksController } from './controllers/jwks-controller.js'

export const routes = (options = {}) => {
  const {
    oidcDiscoveryPath = '/.well-known/openid-configuration',
    jwksPath = '/jwks'
  } = options

  return [
    {
      method: 'GET',
      path: oidcDiscoveryPath,
      ...oidcDiscoveryController
    },
    {
      method: 'GET',
      path: jwksPath,
      ...jwksController
    }
  ]
}
