import { client as oidcClient } from '../../../services/oidc-discovery/client.js'
import { config } from '../../../../config/config.js'

export const authController = {
  handler: async (request, h) => {
    const values = await oidcClient.oidcDetails()
    const clientId = config.get('idService.clientId')
    const baseUrl = config.get('idService.identityServiceBaseUrl')

    const loginUrl =
      `${values.authorization_endpoint}?` +
      `client_id=${clientId}&` +
      `scope=openid+offline_access+${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${baseUrl}/sso&` +
      `state=dummyState&` +
      `response_mode=form_post&` +
      `serviceId=63083639-7d23-4660-846c-317aec37b55d&` +
      `nonce=dummyNonce`
    return h.redirect(loginUrl)
  }
}
