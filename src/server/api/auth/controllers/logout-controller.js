import { client } from '../../../services/oidc-discovery/client.js'
import Wreck from '@hapi/wreck'

export const logoutController = {
  handler: async (request, h) => {
    const defraCiDiscovery = await client.oidcDetails()

    request.yar.reset()
    const res = await Wreck.post(defraCiDiscovery.end_session_endpoint)

    if (!isRegisteredPostLogoutUri(clientId, post_logout_redirect_uri)) {
      return h.response('Invalid post_logout_redirect_uri').code(400)
    }

    return h.redirect(defraCiDiscovery.end_session_endpoint)
  }
}
