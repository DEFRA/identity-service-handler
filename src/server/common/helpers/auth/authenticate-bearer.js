import { jwtVerify } from 'jose'

export async function authenticateBearer(req, h, jwks, brokerProvider) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    throw h.unauthorized()
  }
  const token = auth.slice('Bearer '.length)

  try {
    const { payload } = await jwtVerify(token, jwks, {
      // issuer: env.BROKER_ISSUER
    })
    if (!payload.sub) {
      throw new Error('Missing sub')
    }
    return h.authenticated({ credentials: { sub: payload.sub } })
  } catch {
    try {
      const accessToken = await brokerProvider?.AccessToken?.find(token)
      if (!accessToken?.accountId || accessToken.isExpired) {
        throw new Error('Invalid access token')
      }

      return h.authenticated({
        credentials: { sub: accessToken.accountId }
      })
    } catch {
      throw h.unauthorized()
    }
  }
}
