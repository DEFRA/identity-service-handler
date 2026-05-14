/**
 * @typedef {object} UserCph
 * @property {string} cph
 * @property {string | null} expires
 */

/**
 * @typedef {object} UserContext
 * @property {string} sub
 * @property {string} email
 * @property {string} given_name
 * @property {string} family_name
 * @property {string} display_name
 * @property {UserCph[]} primary_cph
 * @property {UserCph[]} delegated_cph
 */

/**
 * Transforms a raw user profile into the UserContext shape used for OIDC
 * claims and the context API endpoint. Expired delegations are filtered out.
 *
 * @param {import('../../services/user/service.js').UserProfile} profile
 * @returns {UserContext}
 */
export const getUserContext = (profile) => {
  const now = Date.now()
  const {
    user_details: userDetails,
    direct_assignments: directAssignments,
    inbound_delegations: inboundDelegations
  } = profile

  return {
    sub: userDetails.id,
    email: userDetails.email,
    given_name: userDetails.first_name,
    family_name: userDetails.last_name,
    display_name: userDetails.display_name,
    primary_cph: directAssignments.map((a) => ({
      cph: a.county_parish_holding_number,
      expires: null
    })),
    delegated_cph: inboundDelegations
      .map((d) => ({
        cph: d.county_parish_holding_number,
        expires: d.expires_at || null
      }))
      .filter(({ expires }) => !expires || new Date(expires).getTime() > now)
  }
}
