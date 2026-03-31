import { SubjectsService } from '../subjects.js'
import data from '../../../data/users.json' with { type: 'json' }

/**
 * @typedef {import('./service.js').UserDetails} UserDetails
 */

/**
 * @typedef {import('./service.js').UserCphAssignments} UserCphAssignments
 */

const DEFAULT_USER = SubjectsService.generateBrokerSub(
  'dummy-issuer',
  '043f9538-b6b3-41aa-8010-3fb4f310e2b1',
  'default_user@example.com'
)

const users = new Map(
  data.map((user) => [
    SubjectsService.generateBrokerSub(user.iss, user.sub, user.email),
    user
  ])
)

/**
 * Fetches the users CPH assignments for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserCphAssignments>}
 */
export async function getUserCphs(sub) {
  const context = users.get(sub) || users.get(DEFAULT_USER)
  return {
    primary_cph: context.primary_cph || [],
    delegated_cph: context.delegated_cph || []
  }
}

/**
 * Fetches the details for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserDetails>}
 */
export async function getUserDetails(sub) {
  const context = users.get(sub) || users.get(DEFAULT_USER)
  return {
    email: context.email || '',
    display_name: context.display_name || '',
    given_name: context.given_name || '',
    family_name: context.family_name || ''
  }
}
