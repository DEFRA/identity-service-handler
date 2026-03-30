import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'

export const confirmController = () => ({
  handler: async (request, h) => {
    const draftService = new DelegationDraftService(request)

    return h.view('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: draftService.getEmail(),
      cphs: draftService.getCphs()
    })
  }
})

export const confirmSubmitController = (delegationService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationDraftService(request)
    const email = draftService.getEmail()

    await delegationService.createInvite(sub, {
      name: draftService.getFullName(),
      email,
      cphs: draftService.getCphs()
    })

    draftService.clearDraft()

    return h.view('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email
    })
  }
})
