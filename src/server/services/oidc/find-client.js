import { buildClientParams } from './build-client-params.js'

export async function findClient(clientId, clientsService, OidcClient) {
  const c = await clientsService.getClient(clientId)
  if (!c) return undefined
  return new OidcClient(buildClientParams(c))
}
