import data from '../../../data/applications.json' with { type: 'json' }

/**
 * @typedef {import('./service.js').Application} Application
 */

const applications = new Map(data.map((app) => [app.client_id, app]))

/**
 * Fetches an application by client ID from the helper service.
 *
 * @param {string} clientId
 * @returns {Promise<Application>}
 */
export async function get(clientId) {
  const application = applications.get(clientId)
  if (!application) {
    return undefined
  }

  return {
    ...application,
    allowAnyScope: true
  }
}
