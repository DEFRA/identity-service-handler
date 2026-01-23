import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { api } from './api/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([api])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
