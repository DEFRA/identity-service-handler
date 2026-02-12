import { generateKeyPairSync, randomBytes } from 'crypto'
import { exportJWK } from 'jose'

function requireAdmin(req) {
  const key = req.headers['x-admin-api-key']
  const expected = process.env.ADMIN_API_KEY
  return Boolean(expected && key && key === expected)
}

/**
 * Allowlist:
 * - Production: https://*.defra.gov.uk
 * - Dev: http://localhost or http://127.0.0.1
 */
function isAllowedRedirectUri(uri) {
  const u = new URL(uri)

  // Dev allowance
  if (
    u.protocol === 'http:' &&
    (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
  ) {
    return true
  }

  // Prod allowance: https://*.defra.gov.uk
  if (u.protocol !== 'https:') return false
  if (!u.hostname.endsWith('.defra.gov.uk')) return false

  // must be a subdomain, not apex "defra.gov.uk"
  const labels = u.hostname.split('.')
  if (labels.length < 4) return false

  return true
}

export function registerAdminRoutes(server, { registry, cache }) {
  // Create a client (OPTION A enforced: private_key_jwt only)
  server.route({
    method: 'POST',
    path: '/admin/clients',
    options: { auth: false },
    handler: async (req, h) => {
      if (!requireAdmin(req))
        return h.response({ error: 'unauthorized' }).code(401)

      const payload = req.payload ?? {}
      const client_name = payload.client_name ?? 'Unnamed client'
      const redirect_uris = payload.redirect_uris ?? []
      const post_logout_redirect_uris = payload.post_logout_redirect_uris ?? []
      const scope = payload.scope ?? 'openid profile'

      if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
        return h
          .response({ error: 'redirect_uris must be a non-empty array' })
          .code(400)
      }

      for (const uri of [...redirect_uris, ...post_logout_redirect_uris]) {
        try {
          if (!isAllowedRedirectUri(uri)) {
            return h
              .response({
                error: `redirect uri not allowed (must match https://*.defra.gov.uk): ${uri}`
              })
              .code(400)
          }
        } catch {
          return h.response({ error: `invalid uri: ${uri}` }).code(400)
        }
      }

      // Provision client id + "issued but not used" secret
      const client_id = clientsService.constructor.newClientId()
      const client_secret = clientsService.constructor.newClientSecret()
      const client_secret_hash =
        clientsService.constructor.hashSecret(client_secret)

      // Provision RSA keypair for private_key_jwt
      const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      })

      const jwk = await exportJWK(publicKey)
      const kid = randomBytes(8).toString('base64url')
      const jwks = { keys: [{ ...jwk, kid, use: 'sig', alg: 'RS256' }] }

      const clientRecord = {
        client_id,
        client_name,
        redirect_uris,
        post_logout_redirect_uris,
        grant_types: ['authorization_code'],
        response_types: ['code'],
        scope,
        token_endpoint_auth_method: 'private_key_jwt', // OPTION A
        jwks,
        client_secret_hash, // stored but NOT used by oidc-provider in Option A
        is_active: true,
        created_at: new Date().toISOString()
      }

      registry.createClient(clientRecord)
      cache.invalidate(client_id)

      return h
        .response({
          client: {
            client_id,
            client_name,
            redirect_uris,
            post_logout_redirect_uris,
            scope,
            token_endpoint_auth_method: 'private_key_jwt',
            is_active: true,
            jwks_public: jwks
          },
          deliver_to_app_once: {
            issuer: process.env.BROKER_ISSUER,
            client_id,
            client_secret, // issued but NOT accepted for token auth
            token_endpoint_auth_method: 'private_key_jwt',
            private_key_pem: privateKey,
            kid,
            alg: 'RS256'
          }
        })
        .code(201)
    }
  })

  // List clients (safe view)
  server.route({
    method: 'GET',
    path: '/admin/clients',
    options: { auth: false },
    handler: async (req, h) => {
      if (!requireAdmin(req))
        return h.response({ error: 'unauthorized' }).code(401)

      const clients = await clientsService.listClients()
      return {
        clients: clients.map((c) => ({
          client_id: c.client_id,
          client_name: c.client_name,
          is_active: c.is_active,
          redirect_uris: c.redirect_uris,
          post_logout_redirect_uris: c.post_logout_redirect_uris ?? [],
          scope: c.scope,
          created_at: c.created_at,
          updated_at: c.updated_at,
          jwks_kids: Array.isArray(c.jwks?.keys)
            ? c.jwks.keys.map((k) => k.kid).filter(Boolean)
            : []
        }))
      }
    }
  })

  // Get a single client (safe view)
  server.route({
    method: 'GET',
    path: '/admin/clients/{clientId}',
    options: { auth: false },
    handler: async (req, h) => {
      if (!requireAdmin(req))
        return h.response({ error: 'unauthorized' }).code(401)

      const c = await clientsService.getClient(req.params.clientId)
      if (!c) return h.response({ error: 'not_found' }).code(404)

      // Remove secret hash from output
      const { client_secret_hash, ...safe } = c
      safe.jwks_kids = Array.isArray(c.jwks?.keys)
        ? c.jwks.keys.map((k) => k.kid).filter(Boolean)
        : []
      return safe
    }
  })

  // Activate/deactivate
  server.route({
    method: 'PATCH',
    path: '/admin/clients/{clientId}',
    options: { auth: false },
    handler: async (req, h) => {
      if (!requireAdmin(req))
        return h.response({ error: 'unauthorized' }).code(401)

      const payload = req.payload ?? {}
      if (typeof payload.is_active !== 'boolean') {
        return h
          .response({ error: 'payload must include boolean is_active' })
          .code(400)
      }

      const ok = await clientsService.setActive(
        req.params.clientId,
        payload.is_active
      )
      if (!ok) return h.response({ error: 'not_found' }).code(404)

      return { client_id: req.params.clientId, is_active: payload.is_active }
    }
  })

  // Delete (still useful occasionally)
  server.route({
    method: 'DELETE',
    path: '/admin/clients/{clientId}',
    options: { auth: false },
    handler: async (req, h) => {
      if (!requireAdmin(req))
        return h.response({ error: 'unauthorized' }).code(401)

      await clientsService.deleteClient(req.params.clientId)
      return h.response().code(204)
    }
  })
}
