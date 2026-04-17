import Joi from 'joi'
import { statusCodes } from '../../common/constants/status-codes.js'
import { normaliseCheckboxPayload } from '../../common/helpers/normalise-checkbox-payload.js'
import { getDelegatableCphs } from '../helpers/get-delegatable-cphs.js'
import { buildCphCheckboxItems } from '../helpers/build-cph-checkbox-items.js'
import { cphsSchema, getCphValidationError } from '../helpers/validate-cphs.js'

const TEMPLATE = 'delegation/manage'
const PAGE_TITLE = 'Manage delegate'
export const manageController = (delegationService, userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const { delegation_id: delegationId } = request.params
    const delegate = await delegationService.getDelegation(sub, delegationId)

    if (!delegate) {
      return h.redirect('/delegation')
    }

    const userContext = await userService.getUserContext(sub)
    const availableCphs = getDelegatableCphs(userContext)

    return h.view(TEMPLATE, {
      pageTitle: PAGE_TITLE,
      heading: PAGE_TITLE,
      delegate,
      checkboxItems: buildCphCheckboxItems(availableCphs, delegate.cphs ?? [])
    })
  }
})

export const manageUpdateController = (delegationService, userService) => ({
  options: {
    validate: {
      payload: Joi.object({
        crumb: Joi.string(),
        cphs: cphsSchema
      }),
      options: { allowUnknown: true },
      failAction: async (request, h, err) => {
        const sub = request.auth?.credentials?.sub
        const { delegation_id: delegationId } = request.params
        const [delegate, userContext] = await Promise.all([
          delegationService.getDelegation(sub, delegationId),
          userService.getUserContext(sub)
        ])
        const availableCphs = getDelegatableCphs(userContext)

        return h
          .view(TEMPLATE, {
            pageTitle: `Error: ${PAGE_TITLE}`,
            heading: PAGE_TITLE,
            delegate,
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
    const sub = request.auth?.credentials?.sub
    const { delegation_id: delegationId } = request.params
    const cphs = normaliseCheckboxPayload(request.payload.cphs)

    await delegationService.updateDelegation(sub, delegationId, { cphs })

    return h.redirect(`/delegation`)
  }
})
