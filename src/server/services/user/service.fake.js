import data from '../../../data/users.json' with { type: 'json' }

const DEFAULT_USER_SUBJECT_ID = data.find(
  (user) => user.email === 'default_user@example.com'
).sub

const users = new Map(data.map((user) => [user.sub, user]))

/**
 * @param {string} sub
 * @returns {Promise<import('./service.js').UserProfile>}
 */
export const getUserProfile = async (sub) => {
  const user = users.get(sub) || users.get(DEFAULT_USER_SUBJECT_ID)
  return {
    user_details: {
      id: sub,
      email: user.email,
      first_name: user.given_name,
      last_name: user.family_name,
      display_name: user.display_name
    },
    direct_assignments: (user.assignments || []).map((a) => ({
      county_parish_holding_number: a.county_parish_holding_number
    })),
    inbound_delegations: (user.delegations || []).map((d) => ({
      county_parish_holding_number: d.county_parish_holding_number,
      delegated_user_role_name: d.delegated_user_role_name,
      expires_at: d.expires_at || null,
      active: true
    })),
    outbound_delegations: []
  }
}
