import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { api } from './api/index.js'
import { delegation } from './delegation/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server, options = {}) {
      await server.register({ plugin: api.plugin, options })
      await server.register({ plugin: delegation.plugin, options })

      await server.register([serveStaticFiles])
    }
  }
}
