import helperClient from '../../clients/helperClient.js'

export async function get(id) {
  const result = await helperClient.get(`/applications/${id}`)
  return result.payload
}
