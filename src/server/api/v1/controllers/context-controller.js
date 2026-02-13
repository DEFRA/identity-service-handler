export const contextController = (userService) => ({
  handler: async (request, h) => {
    const sub = request.auth?.credentials?.sub
    const context = await userService.getUserContext(request, sub)
    return h.response(context).code(200)
  }
})
