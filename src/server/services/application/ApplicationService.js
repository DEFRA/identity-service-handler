import { Service } from './service.js'
import { ServiceFake } from './service.fake.js'
import { generateHeaders } from '../../common/helpers/api-headers.js'

export class ApplicationService {
  constructor(config) {
    this.init = false
    this.helperConfig = config.get('idService.helper')
    this._impl = this.helperConfig.useFakeClient
      ? new ServiceFake({ config })
      : new Service({ config, baseUrl: this.helperConfig.baseUrl })
  }

  async get(id) {
    const headers = generateHeaders('helper', null)
    await this.initFake()
    return await this._impl.get(headers, id)
  }

  async initFake() {
    if (!this.init && this.helperConfig.useFakeClient) {
      await this._impl.init()
      this.init = true
    }
  }
}
