import Boom from 'boom'
import { client } from '../../../services/token/client.js'

export const tokenController = {
  handler: async (request, h) => {
    try {
      const tokenResponse = await client.issueToken(request)

      return h.response(tokenResponse).type('application/json').code(200)
    } catch (err) {
      request.log('error', `Token issuance failed: ${err.message}`)
      throw Boom.unauthorized('Invalid session')
    }
  }
}
