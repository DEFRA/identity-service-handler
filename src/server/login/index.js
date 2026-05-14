import { create as loginCreate } from './controllers/login-controller.js'

export function registerLoginRoutes(server, { b2cConfiguration }) {
  server.route({
    method: 'GET',
    path: '/login',
    options: { auth: false },
    handler: loginCreate({ b2cConfiguration })
  })
}
