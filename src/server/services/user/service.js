import helperClient from '../../clients/helperClient.js'

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */
/**
 * @typedef {'Owner' | 'Keeper' | 'Agent'} UserCphRole
 */

/**
 * @typedef {object} UserCph
 * @property {string} cph
 * @property {UserCphRole} role
 * @property {string} [expiry_date]
 */
/**
 * @typedef {object} UserDetails
 * @property {string} display_name
 * @property {string} given_name
 * @property {string} family_name
 */

/**
 * @typedef {object} UserCphAssignments
 * @property {UserCph[]} primary_cph
 * @property {UserCph[]} delegated_cph
 */

/**
 * Fetches the users CPH assignments for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserCphAssignments>}
 */
export async function getUserCphs(sub) {
  const response = await helperClient.get(`/user/${sub}/cphs`)

  return response.payload
}

/**
 * Fetches the details for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserDetails>}
 */
export async function getUserDetails(sub) {
  const response = await helperClient.get(`/user/${sub}`)

  return response.payload
}
