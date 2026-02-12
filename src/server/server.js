import path from 'path'
import fs from 'node:fs'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Inert from '@hapi/inert'
import Cookie from '@hapi/cookie'

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
import { createLogger } from './common/helpers/logging/logger.js'
import { auth } from './common/helpers/auth/auth.js'
import { buildBrokerProvider } from './services/oidc/provider.js'
import Redis from 'ioredis'
import { registerOidcRoutes } from './oidc/index.js'
import { UserService } from './services/user/UserService.js'
import { SubjectsService } from './services/subjects.js'
import { ApplicationService } from './services/application/ApplicationService.js'
import { ApplicationCache } from './services/application/ApplicationCache.js'
import { UpstreamStateStore } from './upstream/state-store.js'
import { getOidcRoutes } from './common/helpers/oidc-config.js'
const logger = createLogger()

export async function createServer() {
  setupProxy()

  const redis = new Redis(config.get('redis.host'))

  const applicationService = new ApplicationService(config)
  const clientsService = new ApplicationCache(
    redis,
    applicationService,
    { ttlSeconds: 300 }
  )
  const subjectsService = new SubjectsService(redis)
  const userService = new UserService(redis, config)
  const upstreamStateStore = new UpstreamStateStore(redis)

  const brokerProvider = buildBrokerProvider({
    cookiePassword: config.get('session.cookie.password'),
    issuer: config.get('idService.oidc.issuer'),
    redis,
    clientsService,
    userService
  })

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

  if (config.get('tls.enabled')) {
    serverOptions.tls = {
      key: fs.readFileSync(config.get('tls.key')),
      cert: fs.readFileSync(config.get('tls.cert'))
    }
  }

  const server = hapi.server(serverOptions)

  await server.register([
    Cookie,
    Inert,
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy,
    auth,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  await registerOidcRoutes(server, {
    config,
    brokerProvider,
    subjectsService,
    upstreamStateStore
  })

  server.ext('onRequest', async (req, h) => {
    const p = req.path
    const oidcRoutes = await getOidcRoutes()

    // Let hapi handle anything that is not an oidc route
    if (!oidcRoutes.some((r) => p.startsWith(r))) {
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
