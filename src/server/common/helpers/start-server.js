import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { getFormatedOidcRoutes } from './oidc-config.js'

async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on https://localhost:${config.get('port')}`
  )

  return server
}

async function logServerRoutes(server) {
  const oidcRoutes = getFormatedOidcRoutes()

  const serverRoutes = server
    .table()
    .filter((r) => !r.settings?.isInternal)
    .map((r) => `${r.method.toUpperCase().padEnd(7)} ${r.path}`)

  const routes = [...oidcRoutes, ...serverRoutes]
  routes.sort()
  console.log('\nSupported routes:\n' + routes.join('\n'))
}

export { startServer, logServerRoutes }
