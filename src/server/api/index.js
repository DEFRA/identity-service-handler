import {
  apiController,
  oidcDiscoveryController,
  jwksController
} from './controller.js'

export const api = {
  plugin: {
    name: 'api',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/api/delegated-list/{listId}',
          ...apiController
        },
        {
          method: 'GET',
          path: '/.well-known/openid-configuration',
          ...oidcDiscoveryController
        },
        {
          method: 'GET',
          path: '/.well-known/jwks.json',
          ...jwksController
        }
      ])
    }
  }
}
