const DRAFT_KEY = 'delegationDraft'

/**
 * Session-backed draft storage for the multi-step delegation flow.
 */
export class DelegationBuilder {
  /**
   * @param {{ yar?: { get?: (key: string) => unknown, set?: (key: string, value: unknown) => void, clear?: (key: string) => void } } | { get?: (key: string) => unknown, set?: (key: string, value: unknown) => void, clear?: (key: string) => void }} requestOrYar
   */
  constructor(requestOrYar) {
    this.yar = requestOrYar?.yar ?? requestOrYar
    this.draft = null
  }

  /**
   * Get the full draft from the session.
   * @returns {{ email?: string, cphs?: string[] }}
   */
  getDraft() {
    if (this.draft !== null) {
      return this.draft
    }

    this.draft = this.yar?.get?.(DRAFT_KEY) ?? {}

    return this.draft
  }

  /**
   * Persist the full draft to the session.
   * @param {{ email?: string, cphs?: string[] }} draft
   * @returns {{ email?: string, cphs?: string[] }}
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
  getEmail() {
    return this.getDraft().email
  }

  /**
   * @param {string} email
   * @returns {{ email?: string, cphs?: string[] }}
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
  getCphs() {
    return this.getDraft().cphs ?? []
  }

  /**
   * @param {string[]} cphs
   * @returns {{ email?: string, cphs?: string[] }}
   */
  setCphs(cphs) {
    return this.setDraft({
      ...this.getDraft(),
      cphs
    })
  }
}
