import Boom from 'boom'
import { client as tokenClient } from '../../../services/token/client.js'

export const refreshController = {
  handler: async (request, h) => {
    const refreshToken = request.payload?.refresh_token

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw Boom.badRequest('Missing or invalid refresh_token')
    }

    try {
      const tokenResponse = await tokenClient.refreshToken(
        request,
        refreshToken
      )

      return h.response(tokenResponse).type('application/json').code(200)
    } catch (err) {
      request.log('error', `Refresh failed: ${err.message}`)
      throw Boom.unauthorized('Invalid refresh token')
    }
  }
}
