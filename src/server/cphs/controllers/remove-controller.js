import { logger } from '../../common/helpers/logging/logger.js'
import { getUserProfile } from '../../services/user.js'
import { getAcceptedInboundDelegations } from '../../common/helpers/delegation.js'
import * as delegationService from '../../services/delegation.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const CPHS_ROUTE = '/account/cphs'
const CPHS_FLASH = 'cphsFlash'
const REMOVE_PAGE_TITLE = 'Are you sure you want to stop managing this holding?'

const findAcceptedDelegation = async (delegationId, sub) => {
  const profile = await getUserProfile(sub)
  const accepted = getAcceptedInboundDelegations(profile)
  return accepted.find((d) => d.id === delegationId) ?? null
}

export const removeController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegation_id: delegationId } = request.params
    const delegation = await findAcceptedDelegation(delegationId, sub)

    if (!delegation) {
      return h.redirect(CPHS_ROUTE)
    }

    return h.view('cphs/remove', {
      pageTitle: REMOVE_PAGE_TITLE,
      heading: REMOVE_PAGE_TITLE,
      delegationId: delegation.id,
      cphNumber: delegation.county_parish_holding_number,
      ownerName: delegation.delegating_user_name
    })
  }
}

export const removeSubmitController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegation_id: delegationId } = request.params
    const delegation = await findAcceptedDelegation(delegationId, sub)

    if (!delegation) {
      return h.redirect(CPHS_ROUTE)
    }

    try {
      await delegationService.revokeDelegation(delegationId)
      request.yar.flash(CPHS_FLASH, {
        removed: true,
        cphNumber: delegation.county_parish_holding_number,
        ownerName: delegation.delegating_user_name
      })
      return h.redirect(CPHS_ROUTE)
    } catch (err) {
      logger.error({ delegationId, err }, 'Failed to remove delegated holding')
      return h
        .view('cphs/remove', {
          pageTitle:
            'Error: Are you sure you want to stop managing this holding?',
          heading: REMOVE_PAGE_TITLE,
          delegationId: delegation.id,
          cphNumber: delegation.county_parish_holding_number,
          ownerName: delegation.delegating_user_name,
          error:
            'Something went wrong. Try again or go back to your County Parish Holdings.'
        })
        .code(statusCodes.internalServerError)
    }
  }
}
