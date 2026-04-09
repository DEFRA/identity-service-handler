import { isNonEmptyArray } from '../../../common/helpers/array-utils.js'

export async function buildGrantFromInteraction(brokerProvider, interaction) {
  let grant
  if (interaction.grantId) {
    grant = await brokerProvider.Grant.find(interaction.grantId)
  } else {
    grant = new brokerProvider.Grant({
      accountId: interaction.session?.accountId,
      clientId: interaction.params?.client_id
    })
  }

  const { missingOIDCScope, missingResourceScopes, missingOIDCClaims } =
    interaction.prompt?.details ?? {}

  if (isNonEmptyArray(missingOIDCScope)) {
    grant.addOIDCScope(missingOIDCScope.join(' '))
  }

  if (isNonEmptyArray(missingOIDCClaims)) {
    grant.addOIDCClaims(missingOIDCClaims)
  }

  for (const [indicator, scopes] of Object.entries(
    typeof missingResourceScopes === 'object' ? missingResourceScopes : {}
  )) {
    if (isNonEmptyArray(scopes)) {
      grant.addResourceScope(indicator, scopes.join(' '))
    }
  }
  return grant
}
