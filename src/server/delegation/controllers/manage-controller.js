import Joi from 'joi'
import { logger } from '../../common/helpers/logging/logger.js'
import { getUserProfile } from '../../services/user.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { buildCphCheckboxItems } from '../helpers/build-cph-checkbox-items.js'
import { cphsSchema, getCphValidationError } from '../helpers/validate-cphs.js'
import * as delegationService from '../../services/delegation.js'
import {
  getDelegatableCphs,
  getDelegate
} from '../../common/helpers/delegation.js'

const DELEGATION_ROUTE = '/delegation'
const TEMPLATE = 'delegation/manage'
const PAGE_TITLE = 'Manage delegate'
const MANAGE_FLASH = 'manageFlash'

export const manageController = {
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const profile = await getUserProfile(delegatingUserId)
    const delegatedUser = getDelegate(profile, delegatedUserId)
    if (!delegatedUser) {
      return h.redirect(DELEGATION_ROUTE)
    }

    const [flash] = request.yar.flash(MANAGE_FLASH)

    return h.view(TEMPLATE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email,
      checkboxItems: buildCphCheckboxItems(
        getDelegatableCphs(profile),
        new Set(delegatedUser.cphs.map((cph) => cph.county_parish_holding_id))
      ),
      flash: flash ?? null
    })
  }
}

async function manageUpdateFailAction(request, h, err) {
  const delegatingUserId = request.auth?.credentials?.sub
  const { delegated_user_id: delegatedUserId } = request.params
  const profile = await getUserProfile(delegatingUserId)
  const delegatedUser = getDelegate(profile, delegatedUserId)
  if (!delegatedUser) {
    return h.redirect(DELEGATION_ROUTE).takeover()
  }

  return h
    .view(TEMPLATE, {
      pageTitle: `Error: ${PAGE_TITLE}`,
      heading: PAGE_TITLE,
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email,
      checkboxItems: buildCphCheckboxItems(
        getDelegatableCphs(profile),
        normaliseCheckboxPayload(request.payload?.cphs)
      ),
      errors: {
        cphs: getCphValidationError(err)
      }
    })
    .code(statusCodes.badRequest)
    .takeover()
}

function logResults(results, toCreate, toRevoke) {
  results.slice(0, toCreate.length).forEach((result, i) => {
    if (result.status === 'rejected') {
      logger.error(
        { cphId: toCreate[i], err: result.reason },
        'Failed to create delegation invite'
      )
    }
  })
  results.slice(toCreate.length).forEach((result, i) => {
    if (result.status === 'rejected') {
      logger.error(
        { delegationId: toRevoke[i], err: result.reason },
        'Failed to revoke delegation'
      )
    }
  })
}

function resolveFailures(
  results,
  toCreate,
  toRevoke,
  delegatableCphs,
  delegatedUser
) {
  const createResults = results.slice(0, toCreate.length)
  const revokeResults = results.slice(toCreate.length)

  const failedAdds = toCreate
    .filter((_, i) => createResults[i].status === 'rejected')
    .map((cphId) => delegatableCphs.get(cphId))

  const failedRevokes = toRevoke
    .filter((_, i) => revokeResults[i].status === 'rejected')
    .map(
      (delegationId) =>
        delegatedUser.cphs.find((c) => c.delegation_id === delegationId)
          ?.county_parish_holding_number
    )
    .filter(Boolean)

  return { failedAdds, failedRevokes }
}

export const manageUpdateController = {
  options: {
    validate: {
      payload: Joi.object({
        _csrf: Joi.string(),
        cphs: cphsSchema
      }),
      options: { allowUnknown: true },
      failAction: (request, h, err) => manageUpdateFailAction(request, h, err)
    }
  },
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const profile = await getUserProfile(delegatingUserId)
    const delegatedUser = getDelegate(profile, delegatedUserId)
    if (!delegatedUser) {
      return h.redirect(DELEGATION_ROUTE)
    }

    const delegatableCphs = getDelegatableCphs(profile)
    const existingDelegatedCphs = new Map(
      delegatedUser.cphs.map((cph) => [
        cph.county_parish_holding_id,
        cph.delegation_id
      ])
    )
    const intendedDelegatedCphs = normaliseCheckboxPayload(request.payload.cphs)
    const toCreate = []
    const toRevoke = []

    for (const cphId of delegatableCphs.keys()) {
      if (
        intendedDelegatedCphs.has(cphId) &&
        !existingDelegatedCphs.has(cphId)
      ) {
        toCreate.push(cphId)
      } else if (
        !intendedDelegatedCphs.has(cphId) &&
        existingDelegatedCphs.has(cphId)
      ) {
        toRevoke.push(existingDelegatedCphs.get(cphId))
      } else {
        // no-op: CPH is already in the intended state
      }
    }

    const delegatedUserRoleId = toCreate.length
      ? await delegationService.getDefaultRoleId()
      : null

    const results = await Promise.allSettled([
      ...toCreate.map((countyParishHoldingId) =>
        delegationService.createInvite({
          countyParishHoldingId,
          delegatingUserId,
          delegatedUserEmail: delegatedUser.email,
          delegatedUserRoleId
        })
      ),
      ...toRevoke.map((delegationId) =>
        delegationService.revokeDelegation(delegationId)
      )
    ])

    logResults(results, toCreate, toRevoke)

    const { failedAdds, failedRevokes } = resolveFailures(
      results,
      toCreate,
      toRevoke,
      delegatableCphs,
      delegatedUser
    )

    const manageRoute = `/delegation/${delegatedUserId}/manage`

    if (failedAdds.length || failedRevokes.length) {
      request.yar.flash(MANAGE_FLASH, { failedAdds, failedRevokes })
    } else {
      request.yar.flash(MANAGE_FLASH, { success: true })
    }

    return h.redirect(manageRoute)
  }
}
