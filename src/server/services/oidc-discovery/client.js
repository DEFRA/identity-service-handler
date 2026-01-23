import { config } from '../../../config/config.js'
import { createOidcApiClient } from './service.js'
import { createOidcFakeApiClient } from './service.fake.js'

export const client = config.get('idService.useFakeExternalApi')
  ? createOidcFakeApiClient()
  : createOidcApiClient({
      baseUrl: config.get('idService.identityApiBaseUrl'),
      apiKey: config.get('idService.identityApiKey')
    })
