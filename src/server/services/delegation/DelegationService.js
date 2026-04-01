import * as service from './service.js'
import { DelegationFakeService } from './service.fake.js'

/**
 * @typedef {import('ioredis').Redis | import('ioredis').Cluster} RedisClient
 */

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */

/**
 * @typedef {import('./service.js').Delegate} Delegate
 */

/**
 * @typedef {import('./service.js').DelegationsPage} DelegationsPage
 */

/**
 * @typedef {import('./service.js').DelegateInvite} DelegateInvite
 */

export class DelegationService {
  /**
   * @param {RedisClient} redis
   * @param {AppConfig} config
   */
  constructor(redis, config) {
    this.redis = redis
    this._impl = config.get('idService.helper').useFakeClient
      ? new DelegationFakeService(redis)
      : service
  }

  /**
   * @param {string} userId
   * @param {number} [page=1]
   * @returns {Promise<DelegationsPage>}
   */
  async getDelegations(userId, page = 1) {
    return this._impl.getDelegations(userId, page)
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @returns {Promise<Delegate | undefined>}
   */
  async getDelegation(userId, delegateId) {
    return this._impl.getDelegation(userId, delegateId)
  }

  /**
   * @param {string} userId
   * @param {DelegateInvite} invite
   * @returns {Promise<void>}
   */
  async createInvite(userId, invite) {
    return this._impl.createInvite(userId, invite)
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @param {Partial<Delegate>} updates
   * @returns {Promise<void>}
   */
  async updateDelegation(userId, delegateId, updates) {
    return this._impl.updateDelegation(userId, delegateId, updates)
  }

  /**
   * @param {string} userId
   * @param {string} delegateId
   * @returns {Promise<void>}
   */
  async deleteDelegation(userId, delegateId) {
    return this._impl.deleteDelegation(userId, delegateId)
  }
}
