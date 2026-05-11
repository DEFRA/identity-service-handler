/**
 * @typedef {object} SubjectMapping
 * @property {string} sub
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 */

import { redisClient } from '../common/helpers/redis-client.js'

const prefix = 'subject-map'

/**
 * @param {string} sub
 * @returns {Promise<SubjectMapping | null>}
 */
export async function get(sub) {
  const key = `${prefix}:${sub}`
  const raw = await redisClient.get(key)
  if (raw) {
    return JSON.parse(raw)
  }
  return null
}

/**
 * @param {SubjectMapping} subjectMapping
 * @returns {Promise<SubjectMapping>}
 */
export async function create(subjectMapping) {
  const key = `${prefix}:${subjectMapping.sub}`
  await redisClient.set(key, JSON.stringify(subjectMapping))
  return subjectMapping
}

/**
 * @param {SubjectMapping} subjectMapping
 * @returns {Promise<SubjectMapping>}
 */
export async function getOrCreateBrokerSub({
  sub,
  email,
  firstName,
  lastName
}) {
  const existing = await get(sub)
  if (existing) {
    return existing
  } else {
    return create({ sub, email, firstName, lastName })
  }
}
