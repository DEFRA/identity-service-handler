import { identityHelperServiceApiClient } from '../services/id-helper-service.js'

export const dashboardController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    try {
      const userPayload =
        await identityHelperServiceApiClient.getUserRegistrations(
          request,
          user.email
        )
      const supportedServices =
        await identityHelperServiceApiClient.getSupportedServices(request)
      const supportedRoles =
        await identityHelperServiceApiClient.getSupportedRoles(request)

      if (!userPayload) {
        throw new Error('Dashboard API did not return service information')
      }

      const registeredRoleKeys = new Set(
        userPayload.registeredRoles.map((r) => r.key)
      )
      const availableRoles = supportedServices.map((service) => {
        const serviceRoles = supportedRoles
          .filter(
            (role) => role.services && role.services.includes(service.key)
          )
          .filter((role) => !registeredRoleKeys.has(role.key))
        return {
          serviceKey: service.key,
          roles: serviceRoles
        }
      })

      const tmp = {
        services: supportedServices,
        roles: supportedRoles,
        registeredRoles: userPayload.registeredRoles,
        availableRoles,
        userProfile: user
      }
      return h.view('dashboard/index', tmp)
    } catch (error) {
      console.error('Failed to load dashboard data', error)

      return h
        .view('error/index', {
          title: 'There is a problem',
          heading: 'Unable to load dashboard',
          message: 'Please try again later.',
          linkHref: '/your-defra-account',
          linkText: 'Go to Your Defra account'
        })
        .code(500)
    }
  }
}
