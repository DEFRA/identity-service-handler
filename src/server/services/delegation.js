import helperClient from '../clients/helperClient.js'

/**
 * @typedef {object} CphDelegation
 * @property {string} id
 * @property {string} countyParishHoldingId
 * @property {string} countyParishHoldingNumber
 * @property {string} delegatingUserId
 * @property {string} delegatingUserName
 * @property {string|null} delegatedUserId
 * @property {string|null} delegatedUserName
 * @property {string} delegatedUserRoleId
 * @property {string} delegatedUserRoleName
 * @property {string} delegatedUserEmail
 * @property {string|null} invitationExpiresAt
 * @property {string|null} invitationAcceptedAt
 * @property {string|null} invitationRejectedAt
 * @property {string|null} revokedAt
 * @property {string|null} revokedById
 * @property {string|null} revokedByName
 * @property {string|null} expiresAt
 * @property {boolean} active
 */

/**
 * @typedef {object} DelegateInvite
 * @property {string} countyParishHoldingId
 * @property {string} delegatingUserId
 * @property {string} delegatedUserEmail
 */

/**
 * @param {string} _userId
 * @param {DelegateInvite} invite
 * @returns {Promise<void>}
 */
export const createInvite = async ({
  countyParishHoldingId,
  delegatingUserId,
  delegatedUserId,
  delegatedUserEmail
}) => {
  await helperClient.post('/delegations', {
    payload: {
      county_parish_holding_id: countyParishHoldingId,
      delegating_user_id: delegatingUserId,
      delegated_user_email: delegatedUserEmail,
      delegated_user_role_id: '0c15ba2f-b4ba-406a-a0ae-213de64600a9', // TODO: work out how role id will be chosen
      delegated_user_id:
        delegatedUserId || '00000000-0000-0000-0000-000000000001' // TODO: Replace this quick fix when fixed in back end
    }
  })
}

/**
 * @param {string} delegationId
 * @returns {Promise<void>}
 */
export const revokeDelegation = async (delegationId) => {
  await helperClient.post(`/delegations/${delegationId}:revoke`)
}
