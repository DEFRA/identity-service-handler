import helperClient from '../../clients/helperClient.js'

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */

/**
 * @typedef {object} Application
 * @property {string} id
 * @property {string} name
 * @property {string} client_id
 * @property {string} secret
 * @property {string} tenant_name
 * @property {string} description
 * @property {string[]} scopes
 * @property {string[]} redirect_uri
 */

/**
 * Fetches an application by client ID from the helper service.
 *
 * @param {string} clientId
 * @returns {Promise<Application>}
 */
export async function get(clientId) {
  const result = await helperClient.get(`/applications/${clientId}`)
  return result.payload
}
