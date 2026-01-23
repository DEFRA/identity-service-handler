import path from 'path'
import fs from 'node:fs'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Inert from '@hapi/inert'

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

const logger = createLogger()

export async function createServer() {
  setupProxy()

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

  logger.info(`Current working directory: ${process.cwd()}`)

  server.ext('onPreResponse', catchAll)

  return server
}
