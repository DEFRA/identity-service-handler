import helperClient from '../clients/helperClient.js'
import { config } from '../../config/config.js'

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
 * @typedef {object} Role
 * @property {string} id
 * @property {string} name
 * @property {string} description
 */

/**
 * @returns {Promise<Role[]>}
 */
export const getRoles = async () => {
  const { payload } = await helperClient.get('/roles')
  return payload
}

/**
 * Looks up the role ID for the configured default role name.
 * @returns {Promise<string>}
 */
export const getDefaultRoleId = async () => {
  const roles = await getRoles()
  const name = config.get('delegations.defaultRoleName')
  const role = roles.find((r) => r.name === name)
  if (!role) {
    throw new Error(`Default delegation role not found: ${name}`)
  }
  return role.id
}

/**
 * @typedef {object} DelegateInvite
 * @property {string} countyParishHoldingId
 * @property {string} delegatingUserId
 * @property {string} delegatedUserEmail
 * @property {string} delegatedUserRoleId
 */

/**
 * @param {DelegateInvite} invite
 * @returns {Promise<void>}
 */
export const createInvite = async ({
  countyParishHoldingId,
  delegatingUserId,
  delegatedUserEmail,
  delegatedUserRoleId
}) => {
  await helperClient.post('/delegations', {
    payload: {
      county_parish_holding_id: countyParishHoldingId,
      delegating_user_id: delegatingUserId,
      delegated_user_email: delegatedUserEmail,
      delegated_user_role_id: delegatedUserRoleId
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

/**
 * @param {string} delegationId
 * @returns {Promise<void>}
 */
export const acceptInvitation = async (delegationId) => {
  await helperClient.post(`/delegations/${delegationId}:accept`)
}

/**
 * @param {string} delegationId
 * @returns {Promise<void>}
 */
export const rejectInvitation = async (delegationId) => {
  await helperClient.post(`/delegations/${delegationId}:reject`)
}
