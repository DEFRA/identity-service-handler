import jwt from 'jsonwebtoken'
import { config } from '../../config/config.js'
import { SignJWT } from 'jose'
import { identityHelperServiceApiClient } from '../services/id-helper-service.js'
import Wreck from '@hapi/wreck'
import { defraOicdDetails } from '../services/oidc-discovery-service.js'

export const loginController = {
  async handler(request, h) {
    const values = await defraOicdDetails()
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

export const callbackController = {
  async handler(request, h) {
    const clientId = config.get('idService.clientId')
    const clientSecret = config.get('idService.clientSecret')
    const baseUrl = config.get('idService.identityServiceBaseUrl')
    const code = request.payload.code
    const defraCiDiscovery = await defraOicdDetails()

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

      h.state('access_token', token.access_token, {
        isHttpOnly: true,
        isSecure: process.env.NODE_ENV === 'production',
        isSameSite: 'Lax',
        path: '/',
        ttl: 60 * 60 * 1000
      })

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

export const loginServiceController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }
    const userPayload =
      await identityHelperServiceApiClient.getUserRegistrations(
        request,
        user.email
      )
    const userRole = userPayload.registeredRoles.filter(
      (x) => x.key === request.params.usertype
    )[0]
    const hasDelegateId = userRole.cphs.filter((x) => x.delegated).length > 0
    const delegatedId = hasDelegateId
      ? userRole.cphs.filter((x) => x.delegated)[0].delegateId
      : null
    const primaryCphId = hasDelegateId
      ? null
      : userRole.cphs.filter((x) => !x.delegated)[0].key

    const jwtSecret = new TextEncoder().encode(
      config.get('idService.jwtSecret') || 'development-secret-key'
    )
    const delegateListBaseUrl = config.get('idService.delegateListBaseUrl')
    const oidcIssuer =
      config.get('idService.oidcIssuer') || 'https://login.defra.gov.uk'
    const oidcAudience =
      config.get('idService.oidcAudience') || 'api.cph_mapping_service.gov.uk'
    let generatedToken = null

    try {
      const now = Math.floor(Date.now() / 1000)

      generatedToken = await new SignJWT({
        ...user,
        scopes: ['cph.read', 'cph.delegate', 'user.profile'],
        service: request.params.service,
        role: request.params.usertype,
        primary_cph: primaryCphId,
        cph_delegated_list: hasDelegateId
          ? `${delegateListBaseUrl}${delegatedId}`
          : null
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer(oidcIssuer)
        .setAudience(oidcAudience)
        .setIssuedAt(now)
        .setNotBefore(now)
        .setExpirationTime(now + 15 * 60)
        .sign(jwtSecret)
    } catch (error) {
      console.error('Failed to generate login token', error)
    }

    return h.view('login/loginService', {
      sso: generatedToken,
      decodedToken: jwt.decode(generatedToken)
    })
  }
}

export const logoutController = {
  async handler(request, h) {
    const defraCiDiscovery = await defraOicdDetails()
    request.yar.reset()

    return h.redirect(defraCiDiscovery.end_session_endpoint)
  }
}

export const yourAccountController = {
  handler(request, h) {
    request.yar.reset()
    return h.redirect('/your-defra-account')
  }
}
