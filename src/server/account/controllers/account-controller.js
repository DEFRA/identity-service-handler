import { getUserProfile } from '../../services/user.js'
import {
  getDelegates,
  getPendingInvitations,
  getAcceptedInboundDelegations
} from '../../common/helpers/delegation.js'

export const accountController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const profile = await getUserProfile(sub)

    const ownCount = profile.direct_assignments.length
    const delegatedCount = getAcceptedInboundDelegations(profile).length
    const totalCphCount = ownCount + delegatedCount
    const pendingInvitationsCount = getPendingInvitations(profile).length
    const delegateCount = getDelegates(profile).length

    return h.view('account/account', {
      pageTitle: 'Manage your County Parish Holdings',
      heading: 'Manage your County Parish Holdings',
      totalCphCount,
      ownCount,
      delegatedCount,
      pendingInvitationsCount,
      delegateCount
    })
  }
}
