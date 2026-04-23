import Joi from 'joi'
import { statusCodes } from '../../common/constants/status-codes.js'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { buildCphCheckboxItems } from '../helpers/build-cph-checkbox-items.js'
import { cphsSchema, getCphValidationError } from '../helpers/validate-cphs.js'
import * as delegationService from '../../services/delegation.js'

const TEMPLATE = 'delegation/manage'
const PAGE_TITLE = 'Manage delegate'

export const manageController = (userService) => ({
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const delegatedUser = await userService.getDelegatedUser(
      delegatingUserId,
      delegatedUserId
    )
    if (!delegatedUser) {
      return h.redirect('/delegation')
    }

    const availableCphs = new Map(
      delegatedUser.cphs.map((cph) => [
        cph.county_parish_holding_id,
        cph.county_parish_holding_number
      ])
    )
    const delegatedCphs = new Set(
      delegatedUser.cphs.reduce((acc, curr) => {
        if (curr.delegation_id) {
          acc.push(curr.county_parish_holding_id)
        }
        return acc
      }, [])
    )

    return h.view(TEMPLATE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      delegated_user_id: delegatedUser.id,
      delegated_user_email: delegatedUser.email,
      checkboxItems: buildCphCheckboxItems(availableCphs, delegatedCphs)
    })
  }
})

export const manageUpdateController = (userService) => ({
  options: {
    validate: {
      payload: Joi.object({
        crumb: Joi.string(),
        cphs: cphsSchema
      }),
      options: { allowUnknown: true },
      failAction: async (request, h, err) => {
        const delegatingUserId = request.auth?.credentials?.sub
        const { delegated_user_id: delegatedUserId } = request.params
        const delegatedUser = await userService.getDelegatedUser(
          delegatingUserId,
          delegatedUserId
        )
        const availableCphs = new Map(
          delegatedUser.cphs.map((cph) => [
            cph.county_parish_holding_id,
            cph.county_parish_holding_number
          ])
        )

        return h
          .view(TEMPLATE, {
            pageTitle: `Error: ${PAGE_TITLE}`,
            heading: PAGE_TITLE,
            delegated_user_id: delegatedUser.id,
            delegated_user_email: delegatedUser.email,
            checkboxItems: buildCphCheckboxItems(
              availableCphs,
              normaliseCheckboxPayload(request.payload?.cphs)
            ),
            errors: {
              cphs: getCphValidationError(err)
            }
          })
          .code(statusCodes.badRequest)
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const delegatingUserId = request.auth?.credentials?.sub
    const { delegated_user_id: delegatedUserId } = request.params
    const delegatedUser = await userService.getDelegatedUser(
      delegatingUserId,
      delegatedUserId
    )
    const intendedDelegatedCphs = normaliseCheckboxPayload(request.payload.cphs)

    for (const cph of delegatedUser.cphs) {
      if (
        intendedDelegatedCphs.has(cph.county_parish_holding_id) &&
        !cph.delegation_id
      ) {
        await delegationService.createInvite({
          countyParishHoldingId: cph.county_parish_holding_id,
          delegatingUserId,
          delegatedUserId,
          delegatedUserEmail: delegatedUser.email
        })
      } else if (
        !intendedDelegatedCphs.has(cph.county_parish_holding_id) &&
        cph.delegation_id
      ) {
        await delegationService.revokeDelegation(cph.delegation_id)
      } else {
        // no-op: CPH is already in the intended state
      }
    }

    return h.redirect('/delegation')
  }
})
