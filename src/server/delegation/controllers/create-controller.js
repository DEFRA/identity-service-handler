import Joi from 'joi'
import { statusCodes } from '../../common/constants/status-codes.js'
import { withErrorPageTitle } from '../../common/helpers/with-error-page-title.js'
import { DelegationBuilder } from '../helpers/DelegationBuilder.js'
import { getDelegatableCphs } from '../../common/helpers/delegation.js'

export const createController = () => ({
  handler: async (request, h) => {
    const draftService = new DelegationBuilder(request)

    return h.view(
      'delegation/create',
      viewModel({
        formValues: {
          email: draftService.getEmail() ?? ''
        }
      })
    )
  }
})

export const createSubmitController = (userService) => ({
  options: {
    validate: {
      payload: Joi.object({
        email: Joi.string()
          .trim()
          .lowercase()
          .email({ tlds: { allow: false } })
          .required()
      }),
      failAction: async (request, h, err) => {
        const email = (request.payload?.['email'] || '').trim()
        const errors = getErrorsFromValidation(err)

        return h
          .view(
            'delegation/create',
            viewModel({
              formValues: { email },
              errors
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
    const profile = await userService.getUserProfile(sub)
    const delegatableCphs = getDelegatableCphs(profile)

    draftService.setEmail(request.payload.email.trim().toLowerCase())

    if (delegatableCphs.size === 1) {
      draftService.setCphIds(Array.from(delegatableCphs.keys()))
      return h.redirect('/delegation/create/confirm')
    }

    return h.redirect('/delegation/create/cphs')
  }
})

function getErrorsFromValidation(validationError) {
  const errors = {}
  const details =
    validationError?.details ?? validationError?.data?.details ?? []

  for (const detail of details) {
    const field = detail?.path?.[0]
    if (field === 'email') {
      if (detail?.type === 'string.empty' || detail?.type === 'any.required') {
        errors.email = "Enter the delegate's email address"
      } else {
        errors.email =
          'Enter an email address in the correct format, like name@example.com'
      }
    }
  }

  return errors
}

function viewModel(overrides = {}) {
  const errors = overrides.errors ?? {}

  return {
    pageTitle: withErrorPageTitle('Add a new delegate', errors),
    heading: 'Add a new delegate',
    formValues: {
      email: ''
    },
    errors: {},
    ...overrides
  }
}
