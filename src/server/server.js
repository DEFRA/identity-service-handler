import path from 'node:path'
import fs from 'node:fs'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Inert from '@hapi/inert'
import Cookie from '@hapi/cookie'
import Crumb from '@hapi/crumb'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { requestContext } from './common/helpers/request-context.js'
import { logger } from './common/helpers/logging/logger.js'
import { auth } from './common/helpers/auth/auth.js'
import { buildBrokerProvider } from './services/oidc/build-broker-provider.js'
import { buildRedisClient } from './common/helpers/redis-client.js'
import { registerOidcRoutes } from './oidc/index.js'
import { UserService } from './services/user/UserService.js'
import { SubjectsService } from './services/subjects.js'
import { ApplicationService } from './services/application/ApplicationService.js'
import { ApplicationCache } from './services/application/ApplicationCache.js'
import { UpstreamStateStore } from './upstream/state-store.js'
import { OIDC_ROUTES } from './common/helpers/oidc-config.js'

export async function createServer() {
  setupProxy()

  logger.info(`Starting server with configuration: ${config}`)
  const redis = buildRedisClient(config.get('redis'))
  const services = bootstrapServices(redis)
  const brokerProvider = buildBrokerProvider({
    cookiePassword: config.get('session.cookie.password'),
    sessionCookieSecure: config.get('session.cookie.secure'),
    issuer: config.get('idService.oidc.issuer'),
    redis,
    ...services
  })

  const server = await bootstrapServer()
  await server.register([
    Cookie,
    Crumb,
    Inert,
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy,
    requestContext,
    {
      plugin: auth.plugin,
      options: { brokerProvider }
    },
    {
      plugin: router.plugin,
      options: services
    }
  ])

  await registerOidcRoutes(server, {
    config,
    brokerProvider,
    ...services
  })

  server.ext('onRequest', async (req, h) => {
    // Let hapi handle anything that is not an oidc route
    if (!OIDC_ROUTES.some((r) => req.path.startsWith(r))) {
      return h.continue
    }

    await new Promise((resolve) =>
      brokerProvider.callback()(req.raw.req, req.raw.res, resolve)
    )
    return h.abandon
  })

  logger.info(`Current working directory: ${process.cwd()}`)

  server.ext('onPreResponse', catchAll)

  return server
}

function bootstrapServices(redis) {
  const applicationService = new ApplicationService(config)
  const clientsService = new ApplicationCache(redis, applicationService, {
    ttlSeconds: 300
  })
  const subjectsService = new SubjectsService(redis)
  const userService = new UserService(redis, config)
  const upstreamStateStore = new UpstreamStateStore(redis)
  return {
    applicationService,
    clientsService,
    subjectsService,
    userService,
    upstreamStateStore
  }
}

function bootstrapServer() {
  const serverOptions = {
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  }

  if (process.env.NODE_ENV === 'development' && config.get('tls.enabled')) {
    serverOptions.tls = {
      key: fs.readFileSync(config.get('tls.key')),
      cert: fs.readFileSync(config.get('tls.cert'))
    }
  }
  return hapi.server(serverOptions)
}
