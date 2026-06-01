import { set } from './request-context.js'
import { randomUUID } from 'node:crypto'

export function onPreAuth(request, h) {
  set('correlation_id', request.headers['x-correlation-id'] || randomUUID())
  return h.continue
}
