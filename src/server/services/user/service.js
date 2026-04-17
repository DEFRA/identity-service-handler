import helperClient from '../../clients/helperClient.js'

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */
/**
 * @typedef {object} UserDetails
 * @property {string} id
 * @property {string} email
 * @property {string} display_name
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {object} UserAssociatedCph
 * @property {string} association_id
 * @property {string} county_parish_holding_id
 * @property {string} county_parish_holding_number
 * @property {string} application_id
 * @property {string} role_id
 */

/**
 * @typedef {object} UserDelegatedCph
 * @property {string} delegation_id
 * @property {string} county_parish_holding_id
 * @property {string} county_parish_holding_number
 * @property {string} delegated_user_role_name
 * @property {string} [expires_at]
 */

/**
 * @typedef {object} UserCphAssignments
 * @property {UserAssociatedCph[]} associations
 * @property {UserDelegatedCph[]} delegations
 */

/**
 * Fetches the users CPH assignments for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserCphAssignments>}
 */
export async function getUserCphs(sub) {
  const response = await helperClient.get(`/users/${sub}/cphs`)

  return response.payload
}

/**
 * Fetches the details for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserDetails>}
 */
export async function getUserDetails(sub) {
  const response = await helperClient.get(`/users/${sub}`)

  return response.payload
}
