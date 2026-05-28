import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { api } from './api/index.js'
import { cookies } from './cookies/index.js'
import { delegation } from './delegation/index.js'
import { invitations } from './invitations/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server, options = {}) {
      await server.register({ plugin: api.plugin, options })
      await server.register({ plugin: cookies.plugin, options })
      await server.register({ plugin: delegation.plugin, options })
      await server.register({ plugin: invitations.plugin })

      await server.register([serveStaticFiles])
    }
  }
}
