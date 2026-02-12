import Wreck from '@hapi/wreck'

export class Service {
  constructor({ config, baseUrl }) {
    this.config = config
    this.baseUrl = baseUrl
  }

  async get(headers, id) {
    const result = await Wreck.get(`${this.baseUrl}/applications/${id}`, {
      headers
    })

    if (!result.payload) {
      throw new Error()
    }

    return result
  }
}
