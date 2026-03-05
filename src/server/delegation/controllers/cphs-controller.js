import Joi from 'joi'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { withErrorPageTitle } from '../../common/helpers/with-error-page-title.js'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'

const CPH_REGEX = /^\d{2}\/\d{3}\/\d{4}$/

export const cphsController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const draftService = new DelegationDraftService(request)
    const availableCphs = await getAvailableCphs(userService, request, sub)

    return h.view(
      'delegation/cphs',
      viewModel({
        checkboxItems: buildCheckboxItems(
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
        cphs: Joi.alternatives()
          .try(
            Joi.string().pattern(CPH_REGEX),
            Joi.array().items(Joi.string().pattern(CPH_REGEX)).min(1)
          )
          .required()
      }),
      failAction: async (request, h, err) => {
        const sub = request.auth?.credentials?.sub
        const availableCphs = await getAvailableCphs(userService, request, sub)

        return h
          .view(
            'delegation/cphs',
            viewModel({
              checkboxItems: buildCheckboxItems(
                availableCphs,
                normaliseCheckboxPayload(request.payload?.cphs)
              ),
              formValues: {
                cphs: normaliseCheckboxPayload(request.payload?.cphs)
              },
              errors: {
                cphs: getErrorFromValidation(err)
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
    const availableCphs = await getAvailableCphs(userService, request, sub)

    if (cphs.some((cph) => !availableCphs.includes(cph))) {
      return h
        .view(
          'delegation/cphs',
          viewModel({
            checkboxItems: buildCheckboxItems(availableCphs, cphs),
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
      species: draftService.getSpecies(),
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

function getErrorFromValidation(validationError) {
  const details =
    validationError?.details ?? validationError?.data?.details ?? []

  if (
    details.some(
      (detail) =>
        detail?.type === 'string.pattern.base' ||
        detail?.type === 'array.includes'
    )
  ) {
    return 'Enter a County Parish Holding in the correct format, like 12/345/6789'
  }

  return 'Select at least one County Parish Holding'
}

async function getAvailableCphs(userService, request, sub) {
  const userContext = await userService.getUserContext(request, sub)

  return (userContext.primary_cph || [])
    .filter((cph) => cph.role === 'Owner')
    .map(({ cph }) => cph)
}

function buildCheckboxItems(availableCphs, selectedCphs) {
  return availableCphs.map((cph) => ({
    value: cph,
    text: `County Parish Holding Number ${cph}`,
    checked: selectedCphs.includes(cph)
  }))
}

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
