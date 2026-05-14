/**
 * @typedef {object} DelegateEntry
 * @property {string} id
 * @property {string} email
 * @property {{ county_parish_holding_id: string, county_parish_holding_number: string, delegation_id: string }[]} cphs
 */

/**
 * Builds a deduplicated list of delegates from a user's outbound delegations,
 * grouping CPH assignments under each unique delegated user.
 *
 * @param {import('../../services/user/service.js').UserProfile} userProfile
 * @returns {DelegateEntry[]}
 */
export const getDelegates = (userProfile) => {
  const { outbound_delegations: outboundDelegations } = userProfile

  const delegatesMap = new Map()
  for (const delegation of outboundDelegations) {
    let delegate = delegatesMap.get(delegation.delegated_user_id)
    if (!delegate) {
      delegate = {
        id: delegation.delegated_user_id,
        email: delegation.delegated_user_email,
        cphs: []
      }
      delegatesMap.set(delegation.delegated_user_id, delegate)
    }
    delegate.cphs.push({
      county_parish_holding_id: delegation.county_parish_holding_id,
      county_parish_holding_number: delegation.county_parish_holding_number,
      delegation_id: delegation.id
    })
  }

  return Array.from(delegatesMap.values())
}

/**
 * Returns a single delegate by their user ID, or undefined if not found.
 *
 * @param {import('../../services/user/service.js').UserProfile} userProfile
 * @param {string} delegatedUserId
 * @returns {DelegateEntry | undefined}
 */
export const getDelegate = (userProfile, delegatedUserId) =>
  getDelegates(userProfile).find((delegate) => delegate.id === delegatedUserId)

/**
 * Returns a Map of CPH ID → CPH number for all CPHs the user can delegate,
 * derived from their direct assignments.
 *
 * @param {import('../../services/user/service.js').UserProfile} userProfile
 * @returns {Map<string, string>}
 */
export const getDelegatableCphs = (userProfile) =>
  new Map(
    userProfile.direct_assignments.map((cph) => [
      cph.county_parish_holding_id,
      cph.county_parish_holding_number
    ])
  )
