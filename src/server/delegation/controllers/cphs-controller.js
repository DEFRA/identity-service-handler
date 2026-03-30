import Joi from 'joi'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { withErrorPageTitle } from '../../common/helpers/with-error-page-title.js'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'
import { getDelegatableCphs } from '../helpers/get-delegatable-cphs.js'
import { buildCphCheckboxItems } from '../helpers/build-cph-checkbox-items.js'
import { cphsSchema, getCphValidationError } from '../helpers/validate-cphs.js'

export const cphsController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationDraftService(request)
    const userContext = await userService.getUserContext(sub)
    const availableCphs = getDelegatableCphs(userContext)

    return h.view(
      'delegation/cphs',
      viewModel({
        checkboxItems: buildCphCheckboxItems(
          availableCphs,
          draftService.getCphs()
        ),
        formValues: {
          cphs: draftService.getCphs()
        }
      })
    )
  }
})

export const cphsSubmitController = (delegationService, userService) => ({
  options: {
    validate: {
      payload: Joi.object({
        cphs: cphsSchema
      }),
      failAction: async (request, h, err) => {
        const sub = request.auth?.credentials?.sub
        const userContext = await userService.getUserContext(sub)
        const availableCphs = getDelegatableCphs(userContext)

        return h
          .view(
            'delegation/cphs',
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
          .code(400)
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationDraftService(request)
    const cphs = normaliseCheckboxPayload(request.payload.cphs)
    const userContext = await userService.getUserContext(sub)
    const availableCphs = getDelegatableCphs(userContext)

    if (cphs.some((cph) => !availableCphs.includes(cph))) {
      return h
        .view(
          'delegation/cphs',
          viewModel({
            checkboxItems: buildCphCheckboxItems(availableCphs, cphs),
            formValues: {
              cphs
            },
            errors: {
              cphs: 'Select County Parish Holdings from your available list'
            }
          })
        )
        .code(400)
    }

    draftService.setCphs(cphs)

    await delegationService.createInvite(sub, {
      name: draftService.getFullName(),
      email: draftService.getEmail(),
      cphs: draftService.getCphs()
    })

    const email = draftService.getEmail()
    draftService.clearDraft()

    return h.view('delegation/confirmation', {
      pageTitle: 'You delegation invite has been sent',
      heading: 'You delegation invite has been sent',
      email
    })
  }
})

function viewModel(overrides = {}) {
  const errors = overrides.errors ?? {}

  return {
    pageTitle: withErrorPageTitle('Define delegation access', errors),
    heading: 'Define delegation access',
    caption:
      'Select the County Parish Holdings that your want your delegate to have access to',
    checkboxItems: [],
    formValues: {
      cphs: []
    },
    errors: {},
    ...overrides
  }
}
