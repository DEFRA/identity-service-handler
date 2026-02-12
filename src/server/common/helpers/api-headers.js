import { randomUUID } from 'crypto'
import { config } from '../../../config/config.js'

export async function generateHeaders(request, serviceName, correlationId){
  const operatorId = request?.auth?.credentials?.sub ?? request?.oidc?.session?.accountId
  const processedCorrelationId = correlationId || randomUUID()

  if(!config.get(`idService.${serviceName}.apiKey`)){
    throw new Error(`No API key found for service ${serviceName}`)
  }

  const apiKey = config.get(`idService.${serviceName}.apiKey`)

  return {
    'x-api-key': apiKey,
    'x-api-operator-id': operatorId || '00000000-0000-0000-0000-000000000000',
    'x-api-correlation-id': processedCorrelationId
  }
}
