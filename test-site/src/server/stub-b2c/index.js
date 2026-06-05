import crypto from 'node:crypto'
import { Agent, fetch as undiciFetch } from 'undici'
import { config } from '../../config/config.js'

// RSA key pair generated once at startup
const keyId = crypto.randomUUID()
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
})

// In-memory code store with 10-minute TTL
const pendingCodes = new Map()
const CODE_TTL_MS = 10 * 60 * 1000

function storeCode(code, data) {
  pendingCodes.set(code, { ...data, expiresAt: Date.now() + CODE_TTL_MS })
}

function redeemCode(code) {
  const entry = pendingCodes.get(code)
  if (!entry || Date.now() > entry.expiresAt) {
    pendingCodes.delete(code)
    return null
  }
  pendingCodes.delete(code)
  return entry
}

function signJwt(payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId })
  ).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signing = `${header}.${body}`
  const sig = crypto
    .createSign('sha256')
    .update(signing)
    .sign(privateKey, 'base64url')
  return `${signing}.${sig}`
}

function verifyPkceS256(verifier, challenge) {
  const digest = crypto.createHash('sha256').update(verifier).digest()
  return Buffer.from(digest).toString('base64url') === challenge
}

// Ignore self-signed certs when calling helper locally
const helperAgent = new Agent({ connect: { rejectUnauthorized: false } })

async function findUserByEmail(email) {
  const baseUrl = config.get('stubB2c.helperBaseUrl')
  const apiKey = config.get('stubB2c.helperApiKey')
  let res
  try {
    res = await undiciFetch(`${baseUrl}/users`, {
      dispatcher: helperAgent,
      headers: { 'x-api-key': apiKey, 'x-correlation-id': 'stub-b2c' }
    })
  } catch {
    return { error: `Could not reach helper at ${baseUrl}` }
  }
  if (!res.ok) return { error: `Helper returned ${res.status}` }
  const users = await res.json()
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return user ?? null
}

function getClientId(request) {
  const auth = request.headers.authorization
  if (auth?.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString()
    return decoded.split(':')[0]
  }
  return request.payload?.client_id ?? 'stub-client'
}

// Route handlers

// External base: browser-visible (authorization redirect). Internal base: server-to-server (token, jwks, issuer).
// In Docker these differ; locally they default to the same value.
function b2cExternalBase() {
  return (
    process.env.STUB_B2C_EXTERNAL_BASE ??
    `https://localhost:${config.get('port')}/b2c`
  )
}

function b2cInternalBase() {
  return process.env.STUB_B2C_INTERNAL_BASE ?? b2cExternalBase()
}

function discoveryHandler(request, h) {
  const ext = b2cExternalBase()
  const int = b2cInternalBase()
  return h
    .response({
      issuer: int,
      authorization_endpoint: `${ext}/authorize`,
      token_endpoint: `${int}/token`,
      jwks_uri: `${int}/jwks`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
        'none'
      ],
      scopes_supported: ['openid', 'offline_access', 'email', 'profile'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'email']
    })
    .type('application/json')
}

function jwksHandler(request, h) {
  const jwk = publicKey.export({ format: 'jwk' })
  return h
    .response({ keys: [{ ...jwk, use: 'sig', alg: 'RS256', kid: keyId }] })
    .type('application/json')
}

function authorizeGetHandler(request, h) {
  const {
    state,
    nonce,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  } = request.query
  return h.view('stub-b2c/login.njk', {
    pageTitle: 'Sign in',
    state,
    nonce,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  })
}

async function authorizePostHandler(request, h) {
  const {
    email,
    state,
    nonce,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  } = request.payload

  const user = await findUserByEmail(email)
  const errorMessage = !user
    ? `No user found with email ${email}`
    : (user.error ?? null)
  if (errorMessage) {
    return h.view('stub-b2c/login.njk', {
      pageTitle: 'Sign in',
      state,
      nonce,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      emailValue: email,
      error: errorMessage
    })
  }

  const code = crypto.randomBytes(32).toString('hex')
  storeCode(code, {
    sub: user.id,
    email: user.email,
    nonce,
    codeChallenge,
    codeChallengeMethod
  })

  const redirectUrl = new URL(redirectUri)
  redirectUrl.searchParams.set('code', code)
  redirectUrl.searchParams.set('state', state)
  return h.redirect(redirectUrl.href)
}

async function tokenHandler(request, h) {
  const {
    code,
    code_verifier: codeVerifier,
    grant_type: grantType
  } = request.payload

  if (grantType !== 'authorization_code') {
    return h
      .response({ error: 'unsupported_grant_type' })
      .type('application/json')
      .code(400)
  }

  const entry = redeemCode(code)
  if (!entry) {
    return h
      .response({
        error: 'invalid_grant',
        error_description: 'Unknown or expired code'
      })
      .type('application/json')
      .code(400)
  }

  if (!verifyPkceS256(codeVerifier, entry.codeChallenge)) {
    return h
      .response({
        error: 'invalid_grant',
        error_description: 'PKCE verification failed'
      })
      .type('application/json')
      .code(400)
  }

  const now = Math.floor(Date.now() / 1000)
  const issuer = b2cInternalBase()
  const clientId = getClientId(request)

  const idToken = signJwt({
    iss: issuer,
    sub: entry.sub,
    aud: clientId,
    iat: now,
    exp: now + 3600,
    nonce: entry.nonce,
    email: entry.email
  })

  const accessToken = signJwt({
    iss: issuer,
    sub: entry.sub,
    aud: clientId,
    iat: now,
    exp: now + 3600
  })

  return h
    .response({
      access_token: accessToken,
      token_type: 'Bearer',
      id_token: idToken,
      expires_in: 3600
    })
    .type('application/json')
}

export const stubB2c = {
  plugin: {
    name: 'stub-b2c',
    async register(server) {
      server.route([
        {
          method: 'GET',
          path: '/b2c/.well-known/openid-configuration',
          handler: discoveryHandler
        },
        {
          method: 'GET',
          path: '/b2c/jwks',
          handler: jwksHandler
        },
        {
          method: 'GET',
          path: '/b2c/authorize',
          handler: authorizeGetHandler
        },
        {
          method: 'POST',
          path: '/b2c/authorize',
          handler: authorizePostHandler
        },
        {
          method: 'POST',
          path: '/b2c/token',
          handler: tokenHandler
        }
      ])
    }
  }
}
