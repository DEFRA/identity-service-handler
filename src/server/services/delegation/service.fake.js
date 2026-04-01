import DUMMY_DELEGATES from '../../../data/delegates.json' with { type: 'json' }

/**
 * @typedef {import('./service.js').Delegate} Delegate
 */

/**
 * @typedef {import('./service.js').DelegationsPage} DelegationsPage
 */

/**
 * @typedef {import('./service.js').DelegateInvite} DelegateInvite
 */

const PAGE_SIZE = 5

export class DelegationFakeService {
  /**
   * @param {import('ioredis').Redis} redis
   */
  constructor(redis) {
    this.redis = redis
  }

  async #getValue(userId) {
    const raw = await this.redis.get(`delegates:${userId}`)
    let value

    if (raw) {
      value = JSON.parse(raw)
    }
    if (!value) {
      value = DUMMY_DELEGATES
      await this.#setValue(userId, value)
    } else if (!Array.isArray(value)) {
      throw new TypeError('Malformed delegations')
    }
    return value
  }

  async #setValue(userId, value) {
    await this.redis.set(`delegates:${userId}`, JSON.stringify(value))
  }

  /**
   * @param {string} userId
   * @param {number} [page=1]
   * @returns {Promise<DelegationsPage>}
   */
  async getDelegations(userId, page = 1) {
    const all = await this.#getValue(userId)
    const safePage = Number.isInteger(page) && page > 0 ? page : 1
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
    const currentPage = Math.min(safePage, totalPages)
    const startIndex = PAGE_SIZE * (currentPage - 1)
    const endIndex = startIndex + PAGE_SIZE

    return {
      page: currentPage,
      items: all.slice(startIndex, endIndex),
      total_pages: totalPages,
      total_items: all.length
    }
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @returns {Promise<Delegate | undefined>}
   */
  async getDelegation(userId, delegateId) {
    const delegates = await this.#getValue(userId)
    return delegates.find((d) => d.id === delegateId)
  }

  /**
   * @param {string} userId
   * @param {DelegateInvite} invite
   * @returns {Promise<void>}
   */
  async createInvite(userId, { email, cphs = [] }) {
    const delegates = await this.#getValue(userId)
    await this.#setValue(userId, [
      ...delegates,
      { id: crypto.randomUUID(), email, cphs, active: false }
    ])
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @param {Partial<Delegate>} updates
   * @returns {Promise<void>}
   */
  async updateDelegation(userId, delegateId, updates) {
    const delegates = await this.#getValue(userId)
    await this.#setValue(
      userId,
      delegates.map((d) => (d.id === delegateId ? { ...d, ...updates } : d))
    )
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @returns {Promise<void>}
   */
  async deleteDelegation(userId, delegateId) {
    const delegates = await this.#getValue(userId)
    await this.#setValue(
      userId,
      delegates.filter((d) => d.id !== delegateId)
    )
  }
}
