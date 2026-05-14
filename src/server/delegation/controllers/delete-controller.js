import { getUserProfile } from '../../services/user/index.js'
import * as delegationService from '../../services/delegation.js'
import { getDelegate } from '../../common/helpers/delegation.js'

const DELEGATION_ROUTE = '/delegation'

export const deleteController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const profile = await getUserProfile(sub)
    const delegatedUser = getDelegate(profile, delegatedUserId)
    if (!delegatedUser) {
      return h.redirect(DELEGATION_ROUTE)
    }

    return h.view('delegation/delete', {
      pageTitle: 'Remove delegate',
      heading: 'Are you sure you want to remove this delegate?',
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email
    })
  }
}

export const deleteSubmitController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const profile = await getUserProfile(sub)
    const delegatedUser = getDelegate(profile, delegatedUserId)
    if (!delegatedUser) {
      return h.redirect(DELEGATION_ROUTE)
    }

    // TODO: handle partial failures
    await Promise.allSettled(
      delegatedUser.cphs.map((cph) =>
        delegationService.revokeDelegation(cph.delegation_id)
      )
    )

    return h.redirect(DELEGATION_ROUTE)
  }
}
