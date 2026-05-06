/**
 * Resolves the grant types for a client.
 * Defaults to authorization_code. Strips refresh_token if the client
 * does not have offline_access in its scopes.
 *
 * @param {object} client
 * @returns {string[]}
 */
export function resolveClientGrantTypes(client = {}) {
  const grantTypes = new Set(
    client.grant_types || ['authorization_code', 'refresh_token']
  )

  if (!client.scopes?.includes('offline_access')) {
    grantTypes.delete('refresh_token')
  }
  return Array.from(grantTypes)
}
