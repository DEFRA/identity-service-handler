import { config } from '../../../config/config.js'
import { createTokenApiClient } from './service.js'
import { createFakeTokenApiClient } from './service.fake.js'

export const client = config.get('idService.useFakeExternalApi')
  ? createFakeTokenApiClient()
  : createTokenApiClient({
      baseUrl: config.get('idService.identityApiBaseUrl'),
      apiKey: config.get('idService.identityApiKey')
    })
