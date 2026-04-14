import hapiPulse from 'hapi-pulse'
import { logger } from './logging/logger.js'
import { milliseconds } from './duration.js'

const pulse = {
  plugin: hapiPulse,
  options: {
    logger,
    timeout: milliseconds.tenSeconds
  }
}

export { pulse }
