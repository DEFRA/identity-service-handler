import * as userService from '../../../services/user.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { getUserContext } from '../../../common/helpers/user-context.js'

export const contextController = {
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const profile = await userService.getUserProfile(sub)
    const context = getUserContext(profile)

    return h.response(context).code(statusCodes.ok)
  }
}
