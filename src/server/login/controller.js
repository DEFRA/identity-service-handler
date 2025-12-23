import jwt from 'jsonwebtoken';
import { config } from '../../config/config.js'
import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'
import { identityHelperServiceApiClient } from '../services/id-helper-service.js'

export const loginController = {
  async handler(_request, h) {
    return h.view('login/index', {
      pageTitle: 'Sign in using Government Gateway',
      heading: 'Sign in using Government Gateway',
      defaultUserId: 'testuser2@defra.gov.uk',
      defaultPassword: 'TestUser2$'
    })
  }
}

export const callback2Controller = {
  async handler(_request, h) {
  }
}

export const callbackController = {
  async handler(_request, h) {
    const idToken = _request.payload.id_token
    const user = jwt.decode(idToken)

    h.state('access_token', _request.payload.access_token, {
      isHttpOnly: true,
      isSecure: process.env.NODE_ENV === 'production',
      isSameSite: 'Lax',
      path: '/',
      ttl: 60 * 60 * 1000 // 1 hour (match your token lifetime)
    })

    // store the user details in the cookie
    _request.yar.set({
      user,
      tokens: {
        idToken,
        accessToken: _request.payload.access_token
      }
    });

    return h.redirect('/dashboard')
  }
}


export const loginServiceController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }
    const userPayload = await identityHelperServiceApiClient.getUserRegistrations(_request, user.email)
    const userRole = userPayload.registeredRoles.filter(x=>x.key === _request.params.usertype)[0]
    const hasDelegateId = userRole.cphs.filter(x=>x.delegated).length > 0
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
    const oidcIssuer = config.get('idService.oidcIssuer') || 'https://login.defra.gov.uk'
    const oidcAudience = config.get('idService.oidcAudience') || 'api.cph_mapping_service.gov.uk'
    let generatedToken = null

    try {
      const now = Math.floor(Date.now() / 1000)

      generatedToken = await new SignJWT({
        sub: `user-${user}`,
        oid: `user-${randomUUID()}`,
        name: `${user.name}`,
        email: `${user.email}`,
        scopes: ['cph.read', 'cph.delegate', 'user.profile'],
        service: _request.params.service,
        role: _request.params.usertype,
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
  handler(_request, h) {
    _request.yar.reset()

    return h.redirect('/login')
  }
}

export const sessionInfoController = {
  handler(_request, h) {
    const user = _request.yar.get('user' ) || null

    return h.view('login/session-info.njk', {
      formattedUser: JSON.stringify(user, null, 2)
    })
  }
}

export const resetController = {
  handler(_request, h) {
    _request.yar.reset()
    return h.redirect('/your-defra-account');
  }
}
