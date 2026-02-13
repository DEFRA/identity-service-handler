import Wreck from '@hapi/wreck'

export class Service {
  constructor({ config, baseUrl }) {
    this.config = config
    this.baseUrl = baseUrl
  }

  async getUserContext(headers, id) {
    const userResult = await Wreck.get(`${this.baseUrl}/user/${id}`, {
      headers
    })
    const cphResult = await Wreck.get(`${this.baseUrl}/user/${id}/cphs`, {
      headers
    })

    const result = {
      user: userResult.payload,
      cphs: cphResult.payload
    }

    if (!result.payload) {
      throw new Error()
    }

    return result
  }
}
