import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const delegatesPath = path.resolve(dirname, '../../../data/delegates.json')
const DUMMY_DELEGATES = JSON.parse(readFileSync(delegatesPath, 'utf-8'))

/**
 * Delegation data access service.
 * This is all fake for now. Will be hooked up to backend for real data.
 */
export class DelegationService {
  /**
   * @param {import('ioredis').Redis} redis
   * @param {import('../../../config/config.js').config} config
   */
  constructor(redis, config) {
    this.redis = redis
    this.config = config
  }

  #page_size = 5

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
      throw new Error('Malformed delegations')
    }
    return value
  }

  async #setValue(userId, value) {
    await this.redis.set(`delegates:${userId}`, JSON.stringify(value))
  }

  /**
   * Get all delegations for a user.
   * @param {string} userId
   * @param {number} [page=1]
   * @returns {Promise<{page: number, items: Array<{id: string, email: string, active: boolean}>, total_pages: number, total_items: number}>}
   */
  async getDelegations(userId, page = 1) {
    const all = await this.#getValue(userId)
    const safePage = Number.isInteger(page) && page > 0 ? page : 1
    const totalPages = Math.max(1, Math.ceil(all.length / this.#page_size))
    const currentPage = Math.min(safePage, totalPages)
    const startIndex = this.#page_size * (currentPage - 1)
    const endIndex = startIndex + this.#page_size

    return {
      page: currentPage,
      items: all.slice(startIndex, endIndex),
      total_pages: totalPages,
      total_items: all.length
    }
  }

  /**
   * Get a single delegation by id for a user.
   * @param {string} userId
   * @param {string} delegateId
   * @returns {Promise<{id: string, email: string, active: boolean} | undefined>}
   */
  async getDelegation(userId, delegateId) {
    const delegates = await this.#getValue(userId)
    return delegates.find((d) => d.id === delegateId)
  }
  /**
   * Add a single delegation for a user.
   * @param {string} userId
   * @param {{ email: string, cphs?: string[] }} invite
   * @returns {Promise<void>}
   */
  async createInvite(userId, { email, cphs = [] }) {
    const delegates = await this.#getValue(userId)
    await this.#setValue(userId, [
      ...delegates,
      {
        id: crypto.randomUUID(),
        email,
        cphs,
        active: false
      }
    ])
  }

  /**
   * Update fields on a single delegation.
   * @param {string} userId
   * @param {string} delegateId
   * @param {Partial<{email: string, cphs: string[]}>} updates
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
   * Delete a single delegation by id for a user.
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
