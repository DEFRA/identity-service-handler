import { config } from '../../../config/config.js'
import * as service from './service.js'
import * as serviceFake from './service.fake.js'

const implementation = config.get('idService.helper.useFakeClient')
  ? serviceFake
  : service

export const get = implementation.get
