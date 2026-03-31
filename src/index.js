import process from 'node:process'
import {
  startServer,
  logServerRoutes
} from './server/common/helpers/start-server.js'
import { logger } from './server/common/helpers/logging/logger.js'

const server = await startServer()
await logServerRoutes(server)

process.on('unhandledRejection', (error) => {
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
