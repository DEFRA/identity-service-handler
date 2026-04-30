import helperClient from '../../clients/helperClient.js'
import { buildPaginationSearchParams } from '../../common/helpers/pagination.js'

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
 * @property {UserAssociatedCph[]} assignments
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

/**
 * @typedef {object} DelegatedUser
 * @property {string} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} display_name
 */

/**
 * @typedef {object} DelegatedUsersPage
 * @property {DelegatedUser[]} items
 * @property {number} total_count
 * @property {number} total_pages
 * @property {number} page_number
 * @property {number} page_size
 */

/**
 * @param {string} userId
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<DelegatedUsersPage>}
 */
export async function getUserDelegates(userId, options = {}) {
  const params = buildPaginationSearchParams(options)
  const response = await helperClient.get(
    `/users/${userId}/delegates?${params.toString()}`
  )
  return response.payload
}

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
 * @typedef {object} CphDelegationsPage
 * @property {CphDelegation[]} items
 * @property {number} total_count
 * @property {number} total_pages
 * @property {number} page_number
 * @property {number} page_size
 */

/**
 * Returns all CPH delegations granted to a user by a specific delegating user (CPH owner).
 *
 * @param {string} userId - the delegated user's ID
 * @param {string} delegatingUserId - the CPH owner's ID
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<CphDelegationsPage>}
 */
export async function getUserDelegatedCphsByDelegatingUser(
  userId,
  delegatingUserId,
  options = {}
) {
  const endpoint = `/users/${userId}/delegations/by-cph-assignee/${delegatingUserId}`
  const searchParams = buildPaginationSearchParams(options)
  const response = await helperClient.get(
    `${endpoint}?${searchParams.toString()}`
  )

  return response.payload
}
