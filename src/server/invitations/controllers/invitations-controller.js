import { logger } from '../../common/helpers/logging/logger.js'
import { getUserProfile } from '../../services/user.js'
import * as delegationService from '../../services/delegation.js'
import { getPendingInvitations } from '../../common/helpers/delegation.js'
import {
  buildPagination,
  paginateList
} from '../../common/helpers/pagination.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const INVITATIONS_ROUTE = '/account/invitations'
const INVITATIONS_FLASH = 'invitationsFlash'
const PAGE_SIZE = 5

const parsePage = (queryPage) => {
  if (queryPage === undefined) {
    return undefined
  }
  const page = Number.parseInt(queryPage, 10)
  return Number.isNaN(page) || page < 1 ? null : page
}

async function findPendingInvitation(delegationId, sub) {
  const profile = await getUserProfile(sub)
  const invitations = getPendingInvitations(profile)
  return invitations.find((inv) => inv.id === delegationId) ?? null
}

export const invitationsController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const requestedPage = parsePage(request.query?.page)

    if (requestedPage === null) {
      return h.redirect(request.path)
    }

    const profile = await getUserProfile(sub)
    const sortedInvitations = getPendingInvitations(profile).sort(
      (a, b) =>
        a.delegating_user_id.localeCompare(b.delegating_user_id) ||
        a.county_parish_holding_number.localeCompare(
          b.county_parish_holding_number
        )
    )

    const {
      items: invitations,
      total_pages: totalPages,
      total_count: totalInvitationsCount,
      page_number: page
    } = paginateList(sortedInvitations, {
      page: requestedPage,
      pageSize: PAGE_SIZE
    })

    if (requestedPage !== undefined && requestedPage > totalPages) {
      return h.redirect(request.path)
    }

    const pagination = buildPagination(page, totalPages, request.path)
    const [flash] = request.yar.flash(INVITATIONS_FLASH)

    return h.view('invitations/index', {
      pageTitle: 'Invitations',
      heading: 'Invitations',
      invitations,
      showingInvitationsCount: invitations.length,
      totalInvitationsCount,
      pagination,
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
