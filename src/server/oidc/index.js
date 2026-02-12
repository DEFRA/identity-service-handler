import { create as introCreate } from './controllers/interactionController.js'
import { create as callbackCreate } from './controllers/callbackController.js'
import * as oidc from 'openid-client'

export async function registerOidcRoutes(
  server,
  { config, brokerProvider, subjectsService, upstreamStateStore }
) {
  const b2cConfig = config.get('idService.b2c')
  const b2cConfiguration = await oidc.discovery(
    new URL(b2cConfig.discoveryUrl),
    b2cConfig.clientId,
    b2cConfig.clientSecret
  )

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
      brokerProvider,
      subjectsService,
      upstreamStateStore
    })
  })
}
