import { statusCodes } from '../../../common/constants/status-codes.js'

export const contextController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const context = await userService.getUserContext(sub)
    return h.response(context).code(statusCodes.ok)
  }
})
