import { logger } from '../../common/helpers/logging/logger.js'
import { getUserProfile } from '../../services/user.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import * as delegationService from '../../services/delegation.js'

const CONFIRM_ROUTE = '/delegation/create/confirm'
const CONFIRM_FAILURE_FLASH = 'confirmFailure'

export const confirmController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)

    if (!draftService.getEmail()) {
      return h.redirect('/delegation/create')
    }

    if (!draftService.getCphIds().length) {
      return h.redirect('/delegation/create/cphs')
    }

    const profile = await getUserProfile(sub)
    const selectedCphIds = new Set(draftService.getCphIds())
    const cphs = profile.direct_assignments.reduce((acc, cph) => {
      if (selectedCphIds.has(cph.county_parish_holding_id)) {
        acc.push(cph.county_parish_holding_number)
      }
      return acc
    }, [])

    const [failure] = request.yar.flash(CONFIRM_FAILURE_FLASH)

    let confirmFailure = null
    if (failure) {
      const succeededSet = new Set(failure.succeededCphIds)
      confirmFailure = {
        succeededCphs: profile.direct_assignments
          .filter((cph) => succeededSet.has(cph.county_parish_holding_id))
          .map((cph) => cph.county_parish_holding_number)
      }
    }

    return h.view('delegation/confirm', {
      pageTitle: 'Confirm delegate details',
      heading: 'Confirm delegate details',
      email: draftService.getEmail(),
      cphs,
      confirmFailure
    })
  }
}

export const confirmSubmitController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)
    const email = draftService.getEmail()
    const cphIds = draftService.getCphIds()

    if (!email) {
      return h.redirect('/delegation/create')
    }

    if (!cphIds.length) {
      return h.redirect('/delegation/create/cphs')
    }

    const delegatedUserRoleId = await delegationService.getDefaultRoleId()

    const results = await Promise.allSettled(
      cphIds.map((countyParishHoldingId) =>
        delegationService.createInvite({
          countyParishHoldingId,
          delegatingUserId: sub,
          delegatedUserEmail: email,
          delegatedUserRoleId
        })
      )
    )

    const succeededCphIds = cphIds.filter(
      (_, i) => results[i].status === 'fulfilled'
    )
    const failedCphIds = cphIds.filter(
      (_, i) => results[i].status === 'rejected'
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        logger.error(
          { cphId: cphIds[i], err: result.reason },
          'Failed to create delegation invite'
        )
      }
    })

    if (failedCphIds.length > 0) {
      draftService.setCphIds(failedCphIds)
      request.yar.flash(CONFIRM_FAILURE_FLASH, { succeededCphIds })
      return h.redirect(CONFIRM_ROUTE)
    }

    draftService.clearDraft()

    return h.view('delegation/confirmation', {
      pageTitle: 'Invite sent',
      heading: 'Invite sent',
      email
    })
  }
}
