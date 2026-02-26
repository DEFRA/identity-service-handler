import Joi from 'joi'

export function createController() {
  return {
    handler: async (request, h) => {
      return h.view('delegation/create', viewModel())
    }
  }
}

export function createSubmitController(delegationService) {
  return {
    options: {
      validate: {
        payload: Joi.object({
          fullName: Joi.string().trim().required(),
          email: Joi.string()
            .trim()
            .lowercase()
            .email({ tlds: { allow: false } })
            .required()
        }),
        failAction: async (request, h, err) => {
          const fullName = (request.payload?.['fullName'] || '').trim()
          const email = (request.payload?.['email'] || '').trim()
          const errors = getErrorsFromValidation(err)

          return h
            .view(
              'delegation/create',
              viewModel({
                formValues: { fullName, email },
                errors
              })
            )
            .code(400)
            .takeover()
        }
      }
    },
    handler: async (request, h) => {
      const sub = request.auth?.credentials?.sub

      await delegationService.createInvite(sub, {
        name: request.payload.fullName.trim(),
        email: request.payload.email.trim().toLowerCase()
      })

      return h.redirect('/delegation')
    }
  }
}

function getErrorsFromValidation(validationError) {
  const errors = {}
  const details =
    validationError?.details ?? validationError?.data?.details ?? []

  for (const detail of details) {
    const field = detail?.path?.[0]
    if (field === 'fullName') {
      errors.fullName = 'Enter the full name'
    }
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
  const pageTitlePrefix = Object.keys(errors).length > 0 ? 'Error: ' : ''

  return {
    pageTitle: `${pageTitlePrefix}Add and invite a new delegate`,
    heading: 'Add and invite a new delegate',
    formValues: {
      fullName: '',
      email: ''
    },
    errors: {},
    ...overrides
  }
}
