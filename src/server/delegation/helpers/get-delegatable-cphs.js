/**
 * Returns the list of CPHs the user owns, eligible for delegation.
 * @param {import('../../services/user/UserService.js').UserContext} userContext
 * @returns {string[]}
 */
export function getDelegatableCphs(userContext) {
  return (userContext.primary_cph ?? [])
    .filter((cph) => cph.role === 'Owner')
    .map(({ cph }) => cph)
}
