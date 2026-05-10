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

export const getDelegate = (userProfile, delegatedUserId) =>
  getDelegates(userProfile).find((delegate) => delegate.id === delegatedUserId)

export const getDelegatableCphs = (userProfile) =>
  new Map(
    userProfile.direct_assignments.map((cph) => [
      cph.county_parish_holding_id,
      cph.county_parish_holding_number
    ])
  )
