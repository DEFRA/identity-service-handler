import { logger } from '../../common/helpers/logging/logger.js'
import { getUserProfile } from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import { getPendingInvitations } from '../../common/helpers/delegation.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const INVITATIONS_ROUTE = '/invitations'
const INVITATIONS_FLASH = 'invitationsFlash'

async function findPendingInvitation(delegationId, sub) {
  const profile = await getUserProfile(sub)
  const invitations = getPendingInvitations(profile)
  return invitations.find((inv) => inv.id === delegationId) ?? null
}

export const invitationsController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const profile = await getUserProfile(sub)
    const invitations = getPendingInvitations(profile)
    const [flash] = request.yar.flash(INVITATIONS_FLASH)

    return h.view('invitations/index', {
      pageTitle: 'Invitations',
      heading: 'Invitations',
      invitations,
      flash: flash ?? null
    })
  }
}

export const acceptInvitationConfirmController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    const sub = request.auth?.credentials?.sub
    const invitation = await findPendingInvitation(delegationId, sub)

    if (!invitation) {
      return h.redirect(INVITATIONS_ROUTE)
    }

    return h.view('invitations/accept', {
      pageTitle: 'Accept invitation',
      invitationId: invitation.id,
      delegatingUserName: invitation.delegating_user_name,
      cphNumber: invitation.county_parish_holding_number
    })
  }
}

export const rejectInvitationConfirmController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    const sub = request.auth?.credentials?.sub
    const invitation = await findPendingInvitation(delegationId, sub)

    if (!invitation) {
      return h.redirect(INVITATIONS_ROUTE)
    }

    return h.view('invitations/reject', {
      pageTitle: 'Reject invitation',
      invitationId: invitation.id,
      delegatingUserName: invitation.delegating_user_name,
      cphNumber: invitation.county_parish_holding_number
    })
  }
}

export const acceptInvitationController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    const sub = request.auth?.credentials?.sub
    const invitation = await findPendingInvitation(delegationId, sub)

    if (!invitation) {
      return h.redirect(INVITATIONS_ROUTE)
    }

    try {
      await delegationService.acceptInvitation(delegationId)
      request.yar.flash(INVITATIONS_FLASH, {
        accepted: true,
        cphNumber: invitation.county_parish_holding_number,
        delegatingUserName: invitation.delegating_user_name
      })
      return h.redirect(INVITATIONS_ROUTE)
    } catch (err) {
      logger.error({ delegationId, err }, 'Failed to accept invitation')
      return h
        .view('invitations/accept', {
          pageTitle: 'Error: Accept invitation',
          invitationId: invitation.id,
          delegatingUserName: invitation.delegating_user_name,
          cphNumber: invitation.county_parish_holding_number,
          error:
            'Something went wrong. Try again or go back to your invitations.'
        })
        .code(statusCodes.internalServerError)
    }
  }
}

export const rejectInvitationController = {
  handler: async (request, h) => {
    const { delegation_id: delegationId } = request.params
    const sub = request.auth?.credentials?.sub
    const invitation = await findPendingInvitation(delegationId, sub)

    if (!invitation) {
      return h.redirect(INVITATIONS_ROUTE)
    }

    try {
      await delegationService.rejectInvitation(delegationId)
      request.yar.flash(INVITATIONS_FLASH, {
        rejected: true,
        cphNumber: invitation.county_parish_holding_number,
        delegatingUserName: invitation.delegating_user_name
      })
      return h.redirect(INVITATIONS_ROUTE)
    } catch (err) {
      logger.error({ delegationId, err }, 'Failed to reject invitation')
      return h
        .view('invitations/reject', {
          pageTitle: 'Error: Reject invitation',
          invitationId: invitation.id,
          delegatingUserName: invitation.delegating_user_name,
          cphNumber: invitation.county_parish_holding_number,
          error:
            'Something went wrong. Try again or go back to your invitations.'
        })
        .code(statusCodes.internalServerError)
    }
  }
}
