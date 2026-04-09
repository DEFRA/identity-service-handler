import { buildClientParams } from './build-client-params.js'

/**
 * @typedef {import('../application/ApplicationCache.js').ApplicationCache} ApplicationCache
 */

/**
 * Finds an OIDC client by client ID, returning a new OidcClient instance if found.
 *
 * @param {string} clientId
 * @param {ApplicationCache} clientsService
 * @param {new (params: object) => object} OidcClient
 * @returns {Promise<object | undefined>}
 */
export async function findClient(clientId, clientsService, OidcClient) {
  const c = await clientsService.get(clientId)
  if (!c) return undefined
  return new OidcClient(buildClientParams(c))
}
