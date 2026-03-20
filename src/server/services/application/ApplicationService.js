import * as service from './service.js'
import * as serviceFake from './service.fake.js'

/**
 * @typedef {import('./service.js').Application} Application
 */

/**
 * @typedef {import('../../../config/config.js').AppConfig} AppConfig
 */

export class ApplicationService {
  /**
   * @param {AppConfig} config
   */
  constructor(config) {
    this._impl = config.get('idService.helper')?.useFakeClient
      ? serviceFake
      : service
  }

  /**
   * Fetches an application by client ID from the helper service.
   *
   * @param {string} clientId
   * @returns {Promise<Application>}
   */
  async get(clientId) {
    return this._impl.get(clientId)
  }
}
