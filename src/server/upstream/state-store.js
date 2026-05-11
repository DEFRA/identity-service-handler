import { seconds } from '../common/helpers/duration.js'
import { redisClient } from '../common/helpers/redis-client.js'

const statePrefix = 'upstream:state'
const uidPrefix = 'upstream:uid'

export async function put(state, record, ttlSeconds = seconds.tenMinutes) {
  await redisClient.set(
    `${statePrefix}:${state}`,
    JSON.stringify(record),
    'EX',
    ttlSeconds
  )
}

export async function get(state) {
  const raw = await redisClient.get(`${statePrefix}:${state}`)
  return raw ? JSON.parse(raw) : null
}

export async function del(state) {
  await redisClient.del(`${statePrefix}:${state}`)
}

export async function putByUid(uid, record, ttlSeconds = seconds.tenMinutes) {
  await redisClient.set(
    `${uidPrefix}:${uid}`,
    JSON.stringify(record),
    'EX',
    ttlSeconds
  )
}

export async function getByUid(uid) {
  const raw = await redisClient.get(`${uidPrefix}:${uid}`)
  return raw ? JSON.parse(raw) : null
}

export async function delByUid(uid) {
  await redisClient.del(`${uidPrefix}:${uid}`)
}
