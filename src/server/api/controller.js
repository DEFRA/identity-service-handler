import { identityHelperServiceApiClient } from '../services/id-helper-service.js'

export const apiController = {
  async handler(_request, h) {
    const user = _request.yar.get('user') || null
    if(!user) {
      return h.redirect('/your-defra-account')
    }

    const userPayload = await identityHelperServiceApiClient.getUserRegistrations(_request, user.email)
    if (!userPayload) {
      throw new Error('API did not return service information')
    }
    const selectedRole = userPayload.registeredRoles.filter(
      (x) =>
        x.cphs.include((y) => y.delegateId === _request.params.listId) ===
        _request.params.usertype
    )[0]

    const tmp = userPayload ||{
      delegatedId: selectedRole.delegatedId,
      cphs: selectedRole.cphs
    }
    return tmp
  }
}
