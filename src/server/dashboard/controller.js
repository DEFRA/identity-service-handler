import { identityHelperServiceApiClient } from '../services/id-helper-service.js'

export const dashboardController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if(!user) {
      return h.redirect('/your-defra-account')
    }

    try {
      const userPayload = await identityHelperServiceApiClient.getUserRegistrations(_request, user.email)
      const supportedServices = await identityHelperServiceApiClient.getSupportedServices(_request)
      const supportedRoles = await identityHelperServiceApiClient.getSupportedRoles(_request)

      if (!userPayload) {
        throw new Error('Dashboard API did not return service information')
      }

      const tmp = {
        services: supportedServices,
        roles: supportedRoles,
        registeredRoles: userPayload.registeredRoles,
        userProfile: user
      }
      return h.view('dashboard/index', tmp)

    } catch (error) {
      console.error('Failed to load dashboard data', error)

      return h.view('error/index', {
        title: 'There is a problem',
        heading: 'Unable to load dashboard',
        message: 'Please try again later.',
        linkHref: '/your-defra-account',
        linkText: 'Go to Your Defra account'
      }).code(500)
    }
  }
}
