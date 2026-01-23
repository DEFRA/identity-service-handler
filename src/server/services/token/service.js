export function createTokenApiClient({ baseUrl, apiKey }) {
  return {
    refreshToken: async (request, refreshToken) =>
      refreshToken({ baseUrl, apiKey }, request, refreshToken),
    issueToken: async (request) => issueToken({ baseUrl, apiKey }, request)
  }
}

async function refreshToken(config, request, refreshToken) {
  throw new Error('refreshTokens() is not implemented yet (service stub)')
}

async function issueToken(config, request) {
  throw new Error('refreshTokens() is not implemented yet (service stub)')
}
