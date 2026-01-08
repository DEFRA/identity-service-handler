import { identityHelperServiceApiClient } from '../services/id-helper-service.js'

export const reviewController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }
    const supportedServices =
      await identityHelperServiceApiClient.getSupportedServices(request)
    const supportedRoles =
      await identityHelperServiceApiClient.getSupportedRoles(request)
    const userPayload =
      await identityHelperServiceApiClient.getUserRegistrations(
        request,
        user.email
      )
    const userRole = userPayload.registeredRoles.filter(
      (x) => x.key === request.params.usertype
    )[0]
    const serviceDetails = supportedServices.filter(
      (x) => x.key === request.params.service
    )[0]
    const roleDetails = supportedRoles.filter(
      (x) => x.key === request.params.usertype
    )[0]

    const listRows = userRole.cphs.map((cph, index) => ({
      key: {
        text: cph.delegated ? cph.delegateId : `CPH ${index + 1}`
      },
      value: {
        text: cph.key
      },
      actions: {
        items: [
          {
            href: `/config/${request.params.service}/${request.params.usertype}/${encodeURIComponent(cph.key)}`,
            text: 'Change',
            visuallyHiddenText: cph.key
          }
        ]
      }
    }))
    listRows[listRows.length - 1].actions.items.push({
      href: `/config/${request.params.service}/${request.params.usertype}`,
      text: 'Add New'
    })
    return h.view('registration/review', {
      serviceDetails,
      roleDetails,
      listRows
    })
  }
}

export const selectionController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    const model = await buildSelectionFormData({ request, user })
    return h.view('registration/register-select', model)
  }
}

export const selectionControllerPost = {
  async handler(request, h) {
    const { choice } = request.payload
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    if (!choice) {
      const model = await buildSelectionFormData({
        request,
        user,
        errors: { message: 'Select a role to apply for' },
        values: { choice: '' }
      })

      return h.view('registration/register-select', model).code(400)
    }

    const model = identityHelperServiceApiClient.addRoleToUser(user, choice)
    return h.view('registration/register-complete', model)
  }
}

async function buildSelectionFormData({
  request,
  user,
  errors = null,
  values = {}
}) {
  const supportedServices =
    await identityHelperServiceApiClient.getSupportedServices(request)
  const supportedRoles =
    await identityHelperServiceApiClient.getSupportedRoles(request)
  const userPayload = await identityHelperServiceApiClient.getUserRegistrations(
    request,
    user.email
  )
  const serviceDetails = supportedServices.filter(
    (x) => x.key === request.params.service
  )[0]
  const serviceRoles = supportedRoles.filter(
    (x) =>
      x.services &&
      x.services.includes(request.params.service) &&
      !userPayload.registeredRoles.find((y) => y.key === x.key)
  )

  const listRows = serviceRoles
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((role, index) => ({
      text: role.label,
      value: role.key
    }))

  return {
    serviceDetails,
    userPayload,
    listRows,
    errorSummary: errors ? [{ text: errors.message, href: '#choice' }] : null,
    choiceError: errors ? { text: errors.message } : null
  }
}

export const detailsController = {
  async handler(request, h) {
    const user = request.yar.get('user') || null
    if (!user) {
      return h.redirect('/your-defra-account')
    }

    const supportedRoles =
      await identityHelperServiceApiClient.getSupportedRoles(request)
    const supportedServices =
      await identityHelperServiceApiClient.getSupportedServices(request)

    const tmp = {
      role: (supportedRoles.filter(
        (x) => x.key === request.params.usertype
      ) || { key: 'none', label: 'Missing' })[0],
      service: (supportedServices.filter(
        (x) => x.key === request.params.service
      ) || { key: 'none', label: 'Missing' })[0],
      user
    }

    return h.view('registration/register', tmp)
  }
}
