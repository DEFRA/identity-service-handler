const DRAFT_KEY = 'delegationDraft'

/**
 * Session-backed draft storage for the multi-step delegation flow.
 */
export class DelegationDraftService {
  /**
   * @param {{ yar?: { get?: (key: string) => unknown, set?: (key: string, value: unknown) => void, clear?: (key: string) => void } } | { get?: (key: string) => unknown, set?: (key: string, value: unknown) => void, clear?: (key: string) => void }} requestOrYar
   */
  constructor(requestOrYar) {
    this.yar = requestOrYar?.yar ?? requestOrYar
    this.draft = undefined
  }

  /**
   * Get the full draft from the session.
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  getDraft() {
    if (this.draft !== undefined) {
      return this.draft
    }

    this.draft = this.yar?.get?.(DRAFT_KEY) ?? {}

    return this.draft
  }

  /**
   * Persist the full draft to the session.
   * @param {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }} draft
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  setDraft(draft) {
    this.draft = draft
    this.yar?.set?.(DRAFT_KEY, draft)
    return draft
  }

  /**
   * Clear the current draft from the session.
   * @returns {void}
   */
  clearDraft() {
    this.draft = {}
    this.yar?.clear?.(DRAFT_KEY)
  }

  /**
   * @returns {string | undefined}
   */
  getFullName() {
    return this.getDraft().fullName
  }

  /**
   * @param {string} fullName
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  setFullName(fullName) {
    return this.setDraft({
      ...this.getDraft(),
      fullName
    })
  }

  /**
   * @returns {string | undefined}
   */
  getEmail() {
    return this.getDraft().email
  }

  /**
   * @param {string} email
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  setEmail(email) {
    return this.setDraft({
      ...this.getDraft(),
      email
    })
  }

  /**
   * @returns {string[]}
   */
  getSpecies() {
    return this.getDraft().species ?? []
  }

  /**
   * @param {string[]} species
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  setSpecies(species) {
    return this.setDraft({
      ...this.getDraft(),
      species
    })
  }

  /**
   * @returns {string[]}
   */
  getCphs() {
    return this.getDraft().cphs ?? []
  }

  /**
   * @param {string[]} cphs
   * @returns {{ fullName?: string, email?: string, species?: string[], cphs?: string[] }}
   */
  setCphs(cphs) {
    return this.setDraft({
      ...this.getDraft(),
      cphs
    })
  }
}
