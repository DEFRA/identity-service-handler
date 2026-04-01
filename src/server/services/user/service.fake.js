import { pick } from '../../../common/pick.js'
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
export const getUserCphs = async (sub) =>
  pick(
    users.get(sub) || users.get(DEFAULT_USER),
    'primary_cph',
    'delegated_cph'
  )

/**
 * Fetches the details for a given user identifier.
 *
 * @param {string} sub
 * @returns {Promise<UserDetails>}
 */
export const getUserDetails = async (sub) =>
  pick(
    users.get(sub) || users.get(DEFAULT_USER),
    'email',
    'display_name',
    'given_name',
    'family_name'
  )
