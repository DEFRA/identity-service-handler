import * as delegationService from '../../services/delegation.js'

export const deleteController = (userService) => ({
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const delegatedUser = await userService.getDelegatedUser(
      delegatingUserId,
      delegatedUserId
    )

    return h.view('delegation/delete', {
      pageTitle: 'Remove delegate',
      heading: 'Are you sure you want to remove this delegate?',
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email
    })
  }
})

export const deleteSubmitController = (userService) => ({
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const delegatedUser = await userService.getDelegatedUser(
      delegatingUserId,
      delegatedUserId
    )

    await Promise.all(
      delegatedUser.cphs.reduce((acc, cph) => {
        if (cph.delegation_id) {
          acc.push(delegationService.revokeDelegation(cph.delegation_id))
        }
        return acc
      }, [])
    )

    return h.redirect('/delegation')
  }
})
