import helperClient from '../../clients/helperClient.js'

/**
 * @typedef {object} Delegate
 * @property {string} id
 * @property {string} email
 * @property {string[]} cphs
 * @property {boolean} active
 */

/**
 * @typedef {object} DelegationsPage
 * @property {number} page
 * @property {Delegate[]} items
 * @property {number} total_pages
 * @property {number} total_items
 */

/**
 * @typedef {object} DelegateInvite
 * @property {string} email
 * @property {string[]} [cphs]
 */

/**
 * @param {string} userId
 * @param {number} [page=1]
 * @returns {Promise<DelegationsPage>}
 */
export const getDelegations = async (userId, page = 1) => {
  const response = await helperClient.get(`/delegations/${userId}?page=${page}`)

  return response.payload
}

/**
 * @param {string} userId
 * @param {string} delegateId
 * @returns {Promise<Delegate | undefined>}
 */
export const getDelegation = async (userId, delegateId) => {
  const response = await helperClient.get(
    `/delegations/${userId}/${delegateId}`
  )

  return response.payload
}

/**
 * @param {string} userId
 * @param {DelegateInvite} invite
 * @returns {Promise<void>}
 */
export const createInvite = async (userId, invite) => {
  await helperClient.post(`/delegations/${userId}`, { payload: invite })
}

/**
 * @param {string} userId
 * @param {string} delegateId
 * @param {Partial<Delegate>} updates
 * @returns {Promise<void>}
 */
export const updateDelegation = async (userId, delegateId, updates) => {
  await helperClient.patch(`/delegations/${userId}/${delegateId}`, {
    payload: updates
  })
}

/**
 * @param {string} userId
 * @param {string} delegateId
 * @returns {Promise<void>}
 */
export const deleteDelegation = async (userId, delegateId) => {
  await helperClient.delete(`/delegations/${userId}/${delegateId}`)
}
