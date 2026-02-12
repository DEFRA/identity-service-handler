export function registerApiRoutes(server, { claimsService }) {
  server.route({
    method: 'GET',
    path: '/api/me',
    options: {
      auth: { mode: 'required', strategies: ['session', 'bearer'] }
    },
    handler: async (req) => {
      const brokerSub = req.auth.credentials.sub
      const claims = await claimsService.getClaimsByBrokerSub(brokerSub)
      return { sub: brokerSub, ...claims }
    }
  })
}
