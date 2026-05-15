import { getUserProfile } from '../../services/user.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import * as delegationService from '../../services/delegation.js'

export const confirmController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)
    const profile = await getUserProfile(sub)
    const selectedCphIds = new Set(draftService.getCphIds())
    const cphs = profile.direct_assignments.reduce((acc, cph) => {
      if (selectedCphIds.has(cph.county_parish_holding_id)) {
        acc.push(cph.county_parish_holding_number)
      }
      return acc
    }, [])

    return h.view('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: draftService.getEmail(),
      cphs
    })
  }
}

export const confirmSubmitController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)
    const email = draftService.getEmail()

    // TODO: handle partial failures
    await Promise.allSettled(
      draftService.getCphIds().map((id) =>
        delegationService.createInvite({
          countyParishHoldingId: id,
          delegatingUserId: sub,
          delegatedUserEmail: email
        })
      )
    )

    draftService.clearDraft()

    return h.view('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email
    })
  }
}
