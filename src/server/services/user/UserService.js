import { Service } from './service.js'
import { ServiceFake } from './service.fake.js'
import { generateHeaders } from '../../common/helpers/api-headers.js'

const UserContextKey = 'userContext'

export class UserService {
  constructor(redis, config) {
    this.redis = redis
    this.init = false
    this.helperConfig = config.get('idService.helper')
    this._impl = this.helperConfig.useFakeClient
      ? new ServiceFake({
          config
        })
      : new Service({
          config,
          baseUrl: this.helperConfig.baseUrl
        })
  }

  key(prefix, id) {
    return `${prefix}:${id}`
  }

  async getUserContext(request, id) {
    const headers = await generateHeaders(request, 'helper', null)
    await this.initFake()

    const raw = await this.redis.get(this.key(UserContextKey, id))
    if (raw) return JSON.parse(raw)

    const userContext = await this._impl.getUserContext(headers, id)
    await this.redis.set(
      this.key(UserContextKey, id),
      JSON.stringify(userContext),
      'EX',
      300
    )

    return userContext
  }

  async initFake() {
    if (!this.init && this.helperConfig.useFakeClient) {
      await this._impl.init()
      this.init = true
    }
  }
}
