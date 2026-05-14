/**
 * Returns the list of CPHs the user owns, eligible for delegation.js.
 * @param {import('../../services/user/index.js').UserContext} userContext
 * @returns {string[]}
 */
export function getDelegatableCphs(userContext) {
  return (userContext.primary_cph ?? [])
    .filter((cph) => cph.role === 'Owner')
    .map(({ cph }) => cph)
}
