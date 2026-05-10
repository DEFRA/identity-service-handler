import helperClient from '../../clients/helperClient.js'

/**
 * @typedef {object} UserDetails
 * @property {string} id
 * @property {string} email
 * @property {string} display_name
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {object} CphAssignment
 * @property {string} id
 * @property {string} county_parish_holding_id
 * @property {string} county_parish_holding_number
 * @property {string} user_id
 * @property {string} application_id
 * @property {string} role_id
 * @property {string} role_name
 * @property {string} email
 * @property {string} display_name
 */

/**
 * @typedef {object} CphDelegation
 * @property {string} id
 * @property {string} county_parish_holding_id
 * @property {string} county_parish_holding_number
 * @property {string} delegating_user_id
 * @property {string} delegating_user_name
 * @property {string | null} delegated_user_id
 * @property {string | null} delegated_user_name
 * @property {string} delegated_user_role_id
 * @property {string} delegated_user_role_name
 * @property {string} delegated_user_email
 * @property {string | null} invitation_expires_at
 * @property {string | null} invitation_accepted_at
 * @property {string | null} invitation_rejected_at
 * @property {string | null} revoked_at
 * @property {string | null} revoked_by_id
 * @property {string | null} revoked_by_name
 * @property {string | null} expires_at
 * @property {boolean} active
 */

/**
 * @typedef {object} UserProfile
 * @property {UserDetails} user_details
 * @property {CphAssignment[]} direct_assignments
 * @property {CphDelegation[]} inbound_delegations
 * @property {CphDelegation[]} outbound_delegations
 */

/**
 * @typedef {object} UserCphAssignments
 * @property {CphAssignment[]} assignments
 */

/**
 * Fetches the full profile for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserProfile>}
 */
export async function getUserProfile(sub) {
  const response = await helperClient.get(`/users/${sub}/profile`)
  return response.payload
}
