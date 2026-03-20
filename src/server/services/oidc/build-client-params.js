import { resolveClientGrantTypes } from './resolve-client-grant-types.js'

/**
 * Maps a client record from the clients service to OIDC client parameters.
 *
 * @param {object} client
 * @returns {object}
 */
export function buildClientParams(client) {
  return {
    client_id: client.client_id,
    client_name: client.name,
    redirect_uris: client.redirect_uri,
    post_logout_redirect_uris: client.post_logout_redirect_uris ?? [],
    response_types: client.response_types ?? ['code'],
    grant_types: resolveClientGrantTypes(client),
    token_endpoint_auth_method:
      client.token_endpoint_auth_method ?? 'client_secret_post',
    client_secret: client.secret,
    ...(client.jwks && { jwks: client.jwks }),
    scope: client.scopes?.length ? client.scopes.join(' ') : 'openid'
  }
}
