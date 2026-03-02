import Joi from 'joi'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { withErrorPageTitle } from '../../common/helpers/with-error-page-title.js'
import { DelegationDraftService } from '../../services/delegation/DelegationDraftService.js'

const SPECIES_OPTIONS = ['sheep', 'cattle', 'pigs']

export const speciesController = () => ({
  handler: async (request, h) => {
    const draftService = new DelegationDraftService(request)

    return h.view(
      'delegation/species',
      viewModel({
        formValues: {
          species: draftService.getSpecies()
        }
      })
    )
  }
})

export const speciesSubmitController = () => ({
  options: {
    validate: {
      payload: Joi.object({
        species: Joi.alternatives()
          .try(
            Joi.string().valid(...SPECIES_OPTIONS),
            Joi.array()
              .items(Joi.string().valid(...SPECIES_OPTIONS))
              .min(1)
          )
          .required()
      }),
      failAction: async (request, h) => {
        return h
          .view(
            'delegation/species',
            viewModel({
              formValues: {
                species: normaliseCheckboxPayload(request.payload?.species)
              },
              errors: {
                species: 'Select at least one species'
              }
            })
          )
          .code(400)
          .takeover()
      }
    }
  },
  handler: async (request, h) => {
    const draftService = new DelegationDraftService(request)

    draftService.setSpecies(normaliseCheckboxPayload(request.payload.species))

    return h.redirect('/delegation/create/cphs')
  }
})

function viewModel(overrides = {}) {
  const errors = overrides.errors ?? {}

  return {
    pageTitle: withErrorPageTitle('Select the species you want to delegate', errors),
    heading: 'Select the species you want to delegate',
    formValues: {
      species: []
    },
    errors: {},
    ...overrides
  }
}
