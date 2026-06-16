import {
  invitationsController,
  acceptInvitationConfirmController,
  rejectInvitationConfirmController,
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
    path: '/account/invitations',
    options: sessionAuth,
    ...invitationsController
  },
  {
    method: 'GET',
    path: '/account/invitations/{delegation_id}/accept',
    options: sessionAuth,
    ...acceptInvitationConfirmController
  },
  {
    method: 'GET',
    path: '/account/invitations/{delegation_id}/reject',
    options: sessionAuth,
    ...rejectInvitationConfirmController
  },
  {
    method: 'POST',
    path: '/account/invitations/{delegation_id}/accept',
    options: sessionAuth,
    ...acceptInvitationController
  },
  {
    method: 'POST',
    path: '/account/invitations/{delegation_id}/reject',
    options: sessionAuth,
    ...rejectInvitationController
  }
]
