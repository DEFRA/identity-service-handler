import { config } from '../../../config/config.js'
import * as service from './service.js'
import * as fakeService from './service.fake.js'

const implementation = config.get('idService.helper.useFakeClient')
  ? fakeService
  : service

export const getUserProfile = implementation.getUserProfile
