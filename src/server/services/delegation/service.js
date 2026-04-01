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
 * @param {string} _userId
 * @param {number} [_page=1]
 * @returns {Promise<DelegationsPage>}
 */
export const getDelegations = async (_userId, _page = 1) => {
  throw new Error('Not implemented')
}

/**
 * @param {string} _userId
 * @param {string} _delegateId
 * @returns {Promise<Delegate | undefined>}
 */
export const getDelegation = async (_userId, _delegateId) => {
  throw new Error('Not implemented')
}

/**
 * @param {string} _userId
 * @param {DelegateInvite} _invite
 * @returns {Promise<void>}
 */
export const createInvite = async (_userId, _invite) => {
  throw new Error('Not implemented')
}

/**
 * @param {string} _userId
 * @param {string} _delegateId
 * @param {Partial<Delegate>} _updates
 * @returns {Promise<void>}
 */
export const updateDelegation = async (_userId, _delegateId, _updates) => {
  throw new Error('Not implemented')
}

/**
 * @param {string} _userId
 * @param {string} _delegateId
 * @returns {Promise<void>}
 */
export const deleteDelegation = async (_userId, _delegateId) => {
  throw new Error('Not implemented')
}
