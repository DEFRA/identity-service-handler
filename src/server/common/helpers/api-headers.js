import { randomUUID } from 'node:crypto'
import { config } from '../../../config/config.js'
import { get } from './request-context.js'

export function generateHeaders(serviceName, correlationId) {
  const apiKey = config.get(`idService.${serviceName}.apiKey`)

  if (!apiKey) {
    throw new Error(`No API key found for service ${serviceName}`)
  }

  return {
    'x-api-key': apiKey,
    'x-operator-id':
      get('operator_id') ?? '00000000-0000-0000-0000-000000000000',
    'x-correlation-id': correlationId ?? randomUUID()
  }
}
