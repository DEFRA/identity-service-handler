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
      default: true,
      env: 'TLS_ENABLED'
    },
    key: {
      doc: 'Path to TLS key file',
      format: String,
      default: path.resolve(dirname, '../../certs/localhost-key.pem'),
      env: 'TLS_KEY'
    },
    cert: {
      doc: 'Path to TLS cert file',
      format: String,
      default: path.resolve(dirname, '../../certs/localhost.pem'),
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
        default: 'redis',
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
        default: 'NOT_A_REAL_PASSWORD_MUST_BE_CHANGED',
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
      default: 'redis://localhost:6379',
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
    oidc: {
      issuer: {
        doc: 'Url of the OIDC issuer',
        format: 'url',
        default: 'https://identity-service-handler.defra.gov.uk',
        env: 'OIDC_ISSUER'
      }
    },
    b2c: {
      clientId: {
        doc: 'The B2c Client Id',
        format: String,
        default: 'NOT_A_REAL_CLIENT_ID',
        env: 'B2C_CLIENT_ID'
      },
      serviceId: {
        doc: 'The B2c Service Id',
        format: String,
        default: 'NOT_A_REAL_CLIENT_ID',
        env: 'B2C_SERVICE_ID'
      },
      useFakeClient: {
        doc: 'Toggles whether to use the fake auth api or not',
        format: Boolean,
        default: false,
        env: 'B2C_USE_FAKE_CLIENT'
      },
      clientSecret: {
        doc: 'The B2C Client Secret',
        format: String,
        default: 'NOT_A_REAL_CLIENT_SECRET',
        env: 'B2C_CLIENT_SECRET'
      },
      discoveryUrl: {
        doc: 'The B2C OIDC discovery url',
        format: String,
        default:
          'https://your-account.cpdev.cui.defra.gov.uk/idphub/b2c/b2c_1a_cui_cpdev_signupsignin/.well-known/openid-configuration',
        env: 'B2C_DISCOVERY_URL'
      },
      redirectUrl: {
        doc: 'The B2C OIDC redirect url',
        format: String,
        default: `https://localhost:${process.env.PORT ?? '3000'}/sso`,
        env: 'B2C_REDIRECT_URL'
      }
    },
    handler: {
      baseUrl: {
        doc: 'The base url for this service',
        format: 'url',
        default: `https://localhost:${process.env.PORT ?? '3000'}`,
        env: 'HANDLER_BASEURL'
      },
      apiKeyAdmin: {
        doc: 'The API Key for the service Admin endpoint',
        format: String,
        default:
          'rXlX5VGkoCoPRBFGnjrVyvSyYODJuScFttswo6U7gX9hUk97cmM6c8Bn4fRI5i7e',
        env: 'ADMIN_API_KEY'
      },
      useFakeClient: {
        doc: 'Toggles whether to use the fake client api or not. This is only used for testing purposes.',
        format: Boolean,
        default: false,
        env: 'HANDLER_USE_FAKE_CLIENT'
      }
    },
    helper: {
      baseUrl: {
        doc: 'The base url of the helper service',
        format: 'url',
        default: `https://localhost:3001`,
        env: 'HELPER_BASEURL'
      },
      apiKey: {
        doc: 'The API key for the helper service',
        format: String,
        default:
          'jbz9ljIFoIYaCBwhB0pYYthqZlkF9FqIbf00Cuk0iHlnKMMXHdMSpyXSTU2AsmqG',
        env: 'HELPER_API_KEY'
      },
      useFakeClient: {
        doc: 'Toggles whether to use the fake client api or not. This is only used for testing purposes.',
        format: Boolean,
        default: false,
        env: 'HELPER_USE_FAKE_CLIENT'
      }
    }
  }
})

config.validate({ allowed: 'strict' })
