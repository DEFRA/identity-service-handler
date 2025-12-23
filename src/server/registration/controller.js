import { identityHelperServiceApiClient } from '../services/id-helper-service.js'
import { config } from '../../config/config.js'
import { SignJWT } from 'jose'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'

export const reviewController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }
    const userPayload = await identityHelperServiceApiClient.getUserRegistrations(_request, user.email)
    const supportedServices = await identityHelperServiceApiClient.getSupportedServices(_request)
    const supportedRoles = await identityHelperServiceApiClient.getSupportedRoles(_request)

    const userRole = userPayload.registeredRoles.filter(x=>x.key === _request.params.usertype)[0]
    const hasDelegateId = userRole.cphs.filter(x=>x.delegated).length > 0
    const delegatedId = hasDelegateId
      ? userRole.cphs.filter((x) => x.delegated)[0].delegateId
      : null
    const primaryCphId = hasDelegateId
      ? null
      : userRole.cphs.filter((x) => !x.delegated)[0].key

    return h.view('registration/review', {
      serviceType: _request.params.service,
      userRole,
      primaryCphId,
      delegatedId
    })
  }
}

export const registerController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    const supportedRoles = await identityHelperServiceApiClient.getSupportedRoles(_request)
    const supportedServices = await identityHelperServiceApiClient.getSupportedServices(_request)

    const tmp ={
      role: (supportedRoles.filter((x)=>x.key === _request.params.usertype) || {key:"none", label:"Missing"})[0],
      service: (supportedServices.filter((x)=>x.key === _request.params.service) || {key:"none", label:"Missing"})[0],
      user
    }

    return h.view('registration/register', tmp)
  }
}

const generateRequestId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const registerCompleteController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    const tmp = {
      requestId: generateRequestId()
    }

    return h.view('registration/register-complete', tmp)
  }
}
