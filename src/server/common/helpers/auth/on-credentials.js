import { set } from '../request-context.js'

export function onCredentials(request, h) {
  if (request.auth.isAuthenticated) {
    set('operator_id', request.auth.credentials.sub)
  }
  return h.continue
}
