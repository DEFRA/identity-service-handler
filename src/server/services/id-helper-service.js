import { config } from '../../config/config.js'
import { createIdentityServiceHelperApiClient } from './id-helper-api.js'
import { createFakeIdentityServiceHelperApiClient } from './id-helper-api.fake.js'

export const identityHelperServiceApiClient = config.get(
  'idService.useFakeExternalApi'
)
  ? createFakeIdentityServiceHelperApiClient()
  : createIdentityServiceHelperApiClient({
      baseUrl: config.get('idService.identityApiBaseUrl'),
      apiKey: config.get('idService.identityApiKey')
    })
