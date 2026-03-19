import * as service from './service.js'
import { ServiceFake } from './service.fake.js'

export class ApplicationService {
  constructor(config) {
    this.init = false
    this.helperConfig = config.get('idService.helper')
    this._impl = this.helperConfig.useFakeClient
      ? new ServiceFake({ config })
      : service
  }

  async get(id) {
    await this.initFake()
    return await this._impl.get(id)
  }

  async initFake() {
    if (!this.init && this.helperConfig.useFakeClient) {
      await this._impl.init()
      this.init = true
    }
  }
}
