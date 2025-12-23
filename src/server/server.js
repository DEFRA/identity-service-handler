import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Inert from '@hapi/inert';
// import Jwt from '@hapi/jwt'

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

const logger = createLogger()

export async function createServer() {
  setupProxy()

  const server = hapi.server({
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
  })

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
    // Jwt,
    router // Register all the controllers/routes defined in src/server/router.js
  ])
  //
  // // Auth0 (RS256) via JWKS
  // server.auth.strategy('jwt', 'jwt', {
  //   keys: {
  //     uri: `https://${config.get('idService.auth0domain')}/.well-known/jwks.json`, // e.g., https://your-tenant.eu.auth0.com/.well-known/jwks.json
  //     algorithms: ['RS256']
  //   },
  //   verify: {
  //     aud: config.get('idService.auth0audience'),
  //     iss: `https://${config.get('idService.auth0domain')}`,
  //     nbf: true,
  //     exp: true,
  //     sub: "true"
  //   },
  //   validate: (artifacts) => {
  //     // Example: enforce a scope
  //     // const scopes = artifacts.decoded.payload.scope?.split(' ') || []
  //     // const isAllowed = scopes.includes('read:resource')
  //     // return { isValid: isAllowed, credentials: { ...artifacts.decoded.payload, scopes } }
  //
  //     return { isValid: true, credentials: artifacts.decoded.payload }
  //   }
  // })
  //
  // // Require JWT by default for all routes
  // server.auth.default('jwt')

  logger.info(`Current working directory: ${process.cwd()}`)

  // Serve everything in /public under /assets
  server.route({
    method: 'GET',
    path: '/assets/{param*}',
    options: { auth: false },
    handler: {
      directory: {
        path: path.join(process.cwd(), 'public/assets'),
        listing: false,
        index: false
      }
    }
  })

  server.ext('onPreResponse', catchAll)

  return server
}
