import { resolveClientGrantTypes } from './resolve-client-grant-types.js'

/**
 * @typedef {import('../application/service.js').Application} Application
 */

/**
 * Maps a client record from the clients service to OIDC client parameters.
 *
 * @param {Application} clientApplication
 * @returns {object}
 */
export function buildClientParams(clientApplication) {
  const params = {
    client_id: clientApplication.client_id,
    client_name: clientApplication.name,
    redirect_uris: clientApplication.redirect_uri,
    post_logout_redirect_uris:
      clientApplication.post_logout_redirect_uris ?? [],
    grant_types: resolveClientGrantTypes(clientApplication),
    client_secret: clientApplication.secret,
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post'
  }

  if (!clientApplication.allowAnyScope) {
    params.scope = clientApplication.scopes?.length
      ? clientApplication.scopes.join(' ')
      : 'openid'
  }

  return params
}
