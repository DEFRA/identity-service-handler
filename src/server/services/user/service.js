import helperClient from '../../clients/helperClient.js'

export async function getUserContext(id) {
  const [userResult, cphResult] = await Promise.all([
    helperClient.get(`/user/${id}`),
    helperClient.get(`/user/${id}/cphs`)
  ])

  return {
    user: userResult.payload,
    cphs: cphResult.payload
  }
}
