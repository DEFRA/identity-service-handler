import { getUserProfile } from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import { getPendingInvitations } from '../../common/helpers/delegation.js'

const INVITATIONS_ROUTE = '/invitations'

export const invitationsController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const profile = await getUserProfile(sub)
    const invitations = getPendingInvitations(profile)

    return h.view('invitations/index', {
      pageTitle: 'Invitations',
      heading: 'Invitations',
      invitations
    })
  }
}

export const acceptInvitationController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    await delegationService.acceptInvitation(delegationId)
    return h.redirect(INVITATIONS_ROUTE)
  }
}

export const rejectInvitationController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    await delegationService.rejectInvitation(delegationId)
    return h.redirect(INVITATIONS_ROUTE)
  }
}
