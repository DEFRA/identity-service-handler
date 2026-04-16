import { pick } from '../../../common/pick.js'
import data from '../../../data/users.json' with { type: 'json' }

/**
 * @typedef {import('./service.js').UserDetails} UserDetails
 */

/**
 * @typedef {import('./service.js').UserCphAssignments} UserCphAssignments
 */

const DEFAULT_USER_SUBJECT_ID = data.find(
  (user) => user.email === 'default_user@example.com'
).sub

const users = new Map(data.map((user) => [user.sub, user]))

/**
 * Fetches the users CPH assignments for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserCphAssignments>}
 */
export const getUserCphs = async (sub) =>
  pick(
    users.get(sub) || users.get(DEFAULT_USER_SUBJECT_ID),
    'associations',
    'delegations'
  )

/**
 * Fetches the details for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserDetails>}
 */
export const getUserDetails = async (sub) => ({
  id: sub,
  ...pick(
    users.get(sub) || users.get(DEFAULT_USER_SUBJECT_ID),
    'email',
    'display_name',
    'given_name',
    'family_name'
  )
})
