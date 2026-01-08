import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import convictFormatWithValidator from 'convict-format-with-validator'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const fourHoursMs = 14400000
const oneWeekMs = 604800000

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

convict.addFormats(convictFormatWithValidator)

export const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  tls: {
    enabled: {
      doc: 'Enable TLS/SSL',
      format: Boolean,
      default: false,
      env: 'TLS_ENABLED'
    },
    key: {
      doc: 'Path to TLS key file',
      format: String,
      default: path.resolve(dirname, '../../certs/server.key'),
      env: 'TLS_KEY'
    },
    cert: {
      doc: 'Path to TLS cert file',
      format: String,
      default: path.resolve(dirname, '../../certs/server.cert'),
      env: 'TLS_CERT'
    }
  },
  staticCacheTimeout: {
    doc: 'Static cache timeout in milliseconds',
    format: Number,
    default: oneWeekMs,
    env: 'STATIC_CACHE_TIMEOUT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'identity-service-handler'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Asset path',
    format: String,
    default: '/public',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: process.env.NODE_ENV !== 'test',
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  session: {
    cache: {
      engine: {
        doc: 'backend cache is written to',
        format: ['redis', 'memory'],
        default: isProduction ? 'redis' : 'memory',
        env: 'SESSION_CACHE_ENGINE'
      },
      name: {
        doc: 'server side session cache name',
        format: String,
        default: 'session',
        env: 'SESSION_CACHE_NAME'
      },
      ttl: {
        doc: 'server side session cache ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_CACHE_TTL'
      }
    },
    cookie: {
      ttl: {
        doc: 'Session cookie ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_COOKIE_TTL'
      },
      password: {
        doc: 'session cookie password',
        format: String,
        default: 'the-password-must-be-at-least-32-characters-long',
        env: 'SESSION_COOKIE_PASSWORD',
        sensitive: true
      },
      secure: {
        doc: 'set secure flag on cookie',
        format: Boolean,
        default: isProduction,
        env: 'SESSION_COOKIE_SECURE'
      }
    }
  },
  redis: {
    host: {
      doc: 'Redis cache host',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST'
    },
    username: {
      doc: 'Redis cache username',
      format: String,
      default: '',
      env: 'REDIS_USERNAME'
    },
    password: {
      doc: 'Redis cache password',
      format: '*',
      default: '',
      sensitive: true,
      env: 'REDIS_PASSWORD'
    },
    keyPrefix: {
      doc: 'Redis cache key prefix name used to isolate the cached results across multiple clients',
      format: String,
      default: 'identity-service-handler:',
      env: 'REDIS_KEY_PREFIX'
    },
    useSingleInstanceCache: {
      doc: 'Connect to a single instance of redis instead of a cluster.',
      format: Boolean,
      default: !isProduction,
      env: 'USE_SINGLE_INSTANCE_CACHE'
    },
    useTLS: {
      doc: 'Connect to redis using TLS',
      format: Boolean,
      default: isProduction,
      env: 'REDIS_TLS'
    }
  },
  nunjucks: {
    watch: {
      doc: 'Reload templates when they are changed.',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: isDevelopment
    }
  },
  tracing: {
    header: {
      doc: 'Which header to track',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  idService: {
    jwtSecret: {
      doc: 'The JWT secret to sign with',
      format: String,
      default: 'development-secret-key',
      env: 'JWT_SECRET'
    },
    oidcIssuer: {
      doc: 'Url of the OIDC issuer',
      format: String,
      default: 'https://login.defra.gov.uk',
      env: 'OIDC_ISSUER'
    },
    oidcAudience: {
      doc: 'The audience to request tokens for',
      format: String,
      default: 'api.cph_mapping_service.gov.uk',
      env: 'OIDC_AUDIENCE'
    },
    defraCiEndpoint: {
      doc: 'The endpoint of the DefraCI service.',
      format: String,
      default:
        'https://your-account.cpdev.cui.defra.gov.uk/idphub/b2c/b2c_1a_cui_cpdev_signupsignin',
      env: 'DEFRA_CI_ENDPOINT'
    },
    useFakeExternalApi: {
      doc: 'Toggles whether to use the fake external api or not',
      format: Boolean,
      default: false,
      env: 'USE_FAKE_EXTERNAL_API'
    },
    identityServiceBaseUrl: {
      doc: 'Url of the identity service handler',
      format: String,
      default: 'http://localhost:3000',
      env: 'IDENTITY_HANDLER_BASE_URL'
    },
    delegateListBaseUrl: {
      doc: 'Url for the consumer to call back on for the delegated list of CPHs',
      format: String,
      default: 'https://localhost:3000/api/delegated-list/',
      env: 'DELEGATED_LIST_API_URL'
    },
    identityApiBaseUrl: {
      doc: 'Url of the identity service helper',
      format: String,
      default: 'https://localhost:3999/api',
      env: 'IDENTITY_HELPER_BASE_URL'
    },
    identityApiKey: {
      doc: 'Api key of the identity service helper',
      format: String,
      default: 'NOT_A_REAL_KEY',
      env: 'IDENTITY_HELPER_API_KEY'
    },
    tenant: {
      doc: 'The b2c tenant name',
      format: String,
      default: 'NOT_A_REAL_DOMAIN',
      env: 'B2C_TENANT'
    },
    policy: {
      doc: 'The b2c policy name',
      format: String,
      default: 'NOT_A_REAL_DOMAIN',
      env: 'B2C_POLICY'
    },
    clientId: {
      doc: 'The client id of the B2c tenant',
      format: String,
      default: 'NOT_A_REAL_CLIENT_ID',
      env: 'B2C_CLIENT_ID'
    },
    clientSecret: {
      doc: 'The client secret of the B2c tenant',
      format: String,
      default: 'NOT_A_REAL_CLIENT_SECRET',
      env: 'B2C_CLIENT_SECRET'
    },
    auth0audience: {
      doc: 'The audience of the auth0 tenant',
      format: String,
      default: 'NOT_A_REAL_AUDIENCE',
      env: 'AUTH0_AUDIENCE'
    }
  }
})

config.validate({ allowed: 'strict' })
