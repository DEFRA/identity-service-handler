import process from 'node:process'
import { startServer } from './server/common/helpers/start-server.js'
import { logServerRoutes } from './server/common/helpers/log-server-routes.js'
import { logger } from './server/common/helpers/logging/logger.js'

const server = await startServer()
logServerRoutes(server)

process.on('unhandledRejection', (error) => {
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
