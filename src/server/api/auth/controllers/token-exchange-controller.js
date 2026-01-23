import { client as oidcClient } from '../../../services/oidc-discovery/client.js'
import { config } from '../../../../config/config.js'
import Wreck from '@hapi/wreck'
import jwt from 'jsonwebtoken'

export const tokenExchangeController = {
  handler: async (request, h) => {
    const clientId = config.get('idService.clientId')
    const clientSecret = config.get('idService.clientSecret')
    const baseUrl = config.get('idService.identityServiceBaseUrl')
    const code = request.payload.code
    const defraCiDiscovery = await oidcClient.oidcDetails()

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      scope: `openid offline_access ${clientId}`,
      redirect_uri: `${baseUrl}/sso`
    }).toString()
    const options = {
      payload: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      }
    }

    try {
      const res = await Wreck.post(defraCiDiscovery.token_endpoint, options)
      const token = JSON.parse(res.payload.toString())

      const idToken = token.id_token
      const user = jwt.decode(idToken)

      // h.state('access_token', token.access_token, {
      //   isHttpOnly: true,
      //   isSecure: process.env.NODE_ENV === 'production',
      //   isSameSite: 'Lax',
      //   path: '/',
      //   ttl: 60 * 60 * 1000
      // })

      // store the user details in the cookie
      request.yar.set({
        user,
        tokens: {
          idToken,
          accessToken: token.access_token
        }
      })

      return h.redirect('/dashboard')
    } catch (error) {
      console.error('Failed to exchange authorization code for token', error)
      return h.redirect('/login')
    }
  }
}
