import { config } from '../../../config/config.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'

export default config.get('idService.helper')?.useFakeClient
  ? serviceFake
  : service
