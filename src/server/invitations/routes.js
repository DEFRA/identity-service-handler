import {
  invitationsController,
  acceptInvitationController,
  rejectInvitationController
} from './controllers/invitations-controller.js'

const sessionAuth = {
  auth: {
    mode: 'required',
    strategies: ['session']
  }
}

export const routes = () => [
  {
    method: 'GET',
    path: '/invitations',
    options: sessionAuth,
    ...invitationsController
  },
  {
    method: 'POST',
    path: '/invitations/{delegation_id}/accept',
    options: sessionAuth,
    ...acceptInvitationController
  },
  {
    method: 'POST',
    path: '/invitations/{delegation_id}/reject',
    options: sessionAuth,
    ...rejectInvitationController
  }
]
