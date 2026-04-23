/**
 * Builds govuk checkbox items for a list of CPHs.
 * @param {Map<string, string>} availableCphs
 * @param {Set<string>} selectedCphIds
 * @returns {{ value: string, text: string, checked: boolean }[]}
 */
export function buildCphCheckboxItems(availableCphs, selectedCphIds) {
  return Array.from(availableCphs.entries()).map(([id, cphNumber]) => ({
    value: id,
    text: `County Parish Holding Number ${cphNumber}`,
    checked: selectedCphIds.has(id)
  }))
}
