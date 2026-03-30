/**
 * Builds govuk checkbox items for a list of CPHs.
 * @param {string[]} availableCphs
 * @param {string[]} selectedCphs
 * @returns {{ value: string, text: string, checked: boolean }[]}
 */
export function buildCphCheckboxItems(availableCphs, selectedCphs) {
  return availableCphs.map((cph) => ({
    value: cph,
    text: `County Parish Holding Number ${cph}`,
    checked: selectedCphs.includes(cph)
  }))
}
