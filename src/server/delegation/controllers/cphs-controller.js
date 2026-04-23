import Joi from 'joi'
import { statusCodes } from '../../common/constants/status-codes.js'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { withErrorPageTitle } from '../../common/helpers/with-error-page-title.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import { buildCphCheckboxItems } from '../helpers/build-cph-checkbox-items.js'
import { cphsSchema, getCphValidationError } from '../helpers/validate-cphs.js'

const TEMPLATE = 'delegation/cphs'

export const cphsController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)
    const { associations } = await userService.getUserCphs(sub)
    const selectedCphIds = new Set(draftService.getCphIds())
    const availableCphs = new Map(
      associations.map((cph) => [
        cph.county_parish_holding_id,
        cph.county_parish_holding_number
      ])
    )

    return h.view(
      TEMPLATE,
      viewModel({
        checkboxItems: buildCphCheckboxItems(availableCphs, selectedCphIds),
        formValues: {
          cphs: Array.from(selectedCphIds)
        }
      })
    )
  }
})

export const cphsSubmitController = (userService) => ({
  options: {
    validate: {
      payload: Joi.object({
        cphs: cphsSchema
      }),
      failAction: async (request, h, err) => {
        const sub = request.auth?.credentials?.sub
        const { associations } = await userService.getUserCphs(sub)
        const availableCphs = new Map(
          associations.map((cph) => [
            cph.county_parish_holding_id,
            cph.county_parish_holding_number
          ])
        )

        return h
          .view(
            TEMPLATE,
            viewModel({
              checkboxItems: buildCphCheckboxItems(
                availableCphs,
                normaliseCheckboxPayload(request.payload?.cphs)
              ),
              formValues: {
                cphs: normaliseCheckboxPayload(request.payload?.cphs)
              },
              errors: {
                cphs: getCphValidationError(err)
              }
            })
          )
          .code(statusCodes.badRequest)
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationBuilder(request)
    const selectedCphIds = normaliseCheckboxPayload(request.payload.cphs)
    const { associations } = await userService.getUserCphs(sub)
    const availableCphs = new Map(
      associations.map((cph) => [
        cph.county_parish_holding_id,
        cph.county_parish_holding_number
      ])
    )

    if (
      !selectedCphIds.size ||
      !selectedCphIds.isSubsetOf(new Set(availableCphs.keys()))
    ) {
      return h
        .view(
          TEMPLATE,
          viewModel({
            checkboxItems: buildCphCheckboxItems(availableCphs, selectedCphIds),
            formValues: {
              cphs: Array.from(selectedCphIds)
            },
            errors: {
              cphs: 'Select County Parish Holdings from your available list'
            }
          })
        )
        .code(statusCodes.badRequest)
    }

    draftService.setCphIds(Array.from(selectedCphIds))

    return h.redirect('/delegation/create/confirm')
  }
})

function viewModel(overrides = {}) {
  const errors = overrides.errors ?? {}

  return {
    pageTitle: withErrorPageTitle(
      'Manage access to your County Parish Holdings',
      errors
    ),
    heading: 'Manage access to your County Parish Holdings',
    caption:
      'Select the County Parish Holdings that you want your delegate to have access to',
    checkboxItems: [],
    formValues: {
      cphs: []
    },
    errors: {},
    ...overrides
  }
}
