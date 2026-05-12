import Joi from 'joi'
import { getUserProfile } from '../../services/user/index.js'
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

export const manageController = {
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const profile = await getUserProfile(delegatingUserId)
    const delegatedUser = getDelegate(profile, delegatedUserId)
    if (!delegatedUser) {
      return h.redirect(DELEGATION_ROUTE)
    }
    return h.view(TEMPLATE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email,
      checkboxItems: buildCphCheckboxItems(
        getDelegatableCphs(profile),
        new Set(delegatedUser.cphs.map((cph) => cph.county_parish_holding_id))
      )
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

export const manageUpdateController = {
  options: {
    validate: {
      payload: Joi.object({
        crumb: Joi.string(),
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
    const existingDelegatedCphs = new Map(
      delegatedUser.cphs.map((cph) => [
        cph.county_parish_holding_id,
        cph.delegation_id
      ])
    )
    const intendedDelegatedCphs = normaliseCheckboxPayload(request.payload.cphs)
    const toCreate = []
    const toRevoke = []

    for (const cphId of getDelegatableCphs(profile).keys()) {
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

    // TODO: handle partial failures
    await Promise.allSettled([
      ...toCreate.map((countyParishHoldingId) =>
        delegationService.createInvite({
          countyParishHoldingId,
          delegatingUserId,
          delegatedUserEmail: delegatedUser.email
        })
      ),
      ...toRevoke.map((delegationId) =>
        delegationService.revokeDelegation(delegationId)
      )
    ])

    return h.redirect(DELEGATION_ROUTE)
  }
}
