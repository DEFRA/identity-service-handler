import inert from '@hapi/inert'

import { home } from './home/index.js'
import { stubB2c } from './stub-b2c/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Application specific routes, add your own routes here
      await server.register([home])
      await server.register([stubB2c])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
