import { config } from '../../../config/config.js'
import * as service from './service.js'
import * as fakeService from './service.fake.js'

export default config.get('idService.helper')?.useFakeClient
  ? fakeService
  : service
