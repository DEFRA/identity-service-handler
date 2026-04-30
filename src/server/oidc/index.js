import { create as introCreate } from './controllers/interactionController.js'
import { create as callbackCreate } from './controllers/callbackController.js'
import { create as signoutCreate } from './controllers/signoutController.js'

export async function registerOidcRoutes(
  server,
  {
    config,
    brokerProvider,
    subjectsService,
    upstreamStateStore,
    b2cConfiguration
  }
) {
  server.route({
    method: 'GET',
    path: '/signout',
    options: {
      auth: {
        mode: 'try',
        strategies: ['session']
      }
    },
    handler: signoutCreate({ config, b2cConfiguration })
  })

  server.route({
    method: 'GET',
    path: '/interaction/{uid}',
    options: {
      auth: {
        mode: 'try',
        strategies: ['session']
      }
    },
    handler: introCreate({
      config,
      b2cConfiguration,
      brokerProvider,
      upstreamStateStore
    })
  })

  server.route({
    method: ['GET', 'POST'],
    path: '/sso',
    options: {
      auth: {
        mode: 'try',
        strategies: ['session']
      }
    },
    handler: callbackCreate({
      config,
      b2cConfiguration,
      subjectsService,
      upstreamStateStore
    })
  })
}
