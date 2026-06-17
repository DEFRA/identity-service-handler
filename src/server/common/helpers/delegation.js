/**
 * @typedef {object} DelegateEntry
 * @property {string} id
 * @property {string} email
 * @property {Date} createdAt - earliest invitation_expires_at across the delegate's CPHs, cast to Date, used as a proxy for when the delegate relationship was first created
 * @property {{ county_parish_holding_id: string, county_parish_holding_number: string, delegation_id: string }[]} cphs
 */

/**
 * Builds a deduplicated list of delegates from a user's outbound delegations,
 * grouping CPH assignments under each unique delegated user.
 * Uses the earliest invitation_expires_at across each delegate's CPHs as a
 * creation time proxy, since created_at is not exposed by the profile endpoint.
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
        createdAt: new Date(delegation.invitation_expires_at),
        cphs: []
      }
      delegatesMap.set(delegation.delegated_user_id, delegate)
    }

    const expiresAt = new Date(delegation.invitation_expires_at)
    if (expiresAt < delegate.createdAt) {
      delegate.createdAt = expiresAt
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

/**
 * Returns inbound delegations that have not yet been accepted, rejected, or revoked.
 *
 * @param {import('../../services/user.js').UserProfile} userProfile
 * @returns {import('../../services/user.js').CphDelegation[]}
 */
export const getPendingInvitations = (userProfile) =>
  userProfile.inbound_delegations.filter(
    (delegation) =>
      !delegation.invitation_accepted_at &&
      !delegation.invitation_rejected_at &&
      !delegation.revoked_at
  )

/**
 * Returns inbound delegations that have been accepted and not subsequently revoked.
 *
 * @param {import('../../services/user.js').UserProfile} userProfile
 * @returns {import('../../services/user.js').CphDelegation[]}
 */
export const getAcceptedInboundDelegations = (userProfile) =>
  userProfile.inbound_delegations.filter((delegation) => delegation.active)
