export function createFakeTokenApiClient() {
  return {
    refreshToken: async (request, refreshToken) =>
      refreshToken(request, refreshToken),
    issueToken: async (request) => issueToken(request)
  }
}

async function refreshToken(request, refreshToken) {
  return {
    token_type: 'Bearer',
    expires_in: 900,
    access_token: 'FAKE_ACCESS_TOKEN',
    refresh_token: 'FAKE_REFRESH_TOKEN_ROTATED'
  }
}

async function issueToken(request) {
  return {
    token_type: 'Bearer',
    expires_in: 900,
    access_token: 'FAKE_ACCESS_TOKEN',
    refresh_token: 'FAKE_REFRESH_TOKEN'
  }
}
