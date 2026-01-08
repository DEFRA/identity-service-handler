import { health } from './health/index.js'
import { login } from './login/index.js'
import { dashboard } from './dashboard/index.js'
import { registration } from './registration/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { api } from './api/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([login, dashboard, registration, api])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
