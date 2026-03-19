import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import { generateHeaders } from '../common/helpers/api-headers.js'

const buildOptions = (options = {}) => ({
  baseUrl: config.get('idService.helper.baseUrl'),
  json: true,
  ...options,
  headers: Object.assign(
    generateHeaders('helper', options.correlationId),
    options.headers
  )
})

const parseError = (statusCode, payload) => {
  if (payload?.error?.code) {
    return new Error(`${payload.error.code} - ${payload.error.message}`)
  }
  if (payload?.detail || payload?.title) {
    return new Error(`${payload.status} - ${payload.detail || payload.title}`)
  }
  if (statusCode === 422) {
    return new Error('Validation failed')
  }
  return new Error(`Request failed - ${statusCode}`)
}

const request = async (call) => {
  let result
  try {
    result = await call()
  } catch (err) {
    throw parseError(err.output?.statusCode, err.data?.payload)
  }

  if (result.res?.statusCode >= 400) {
    throw parseError(result.res.statusCode, result.payload)
  }

  return result
}

export default {
  get: (path, options) => request(() => Wreck.get(path, buildOptions(options))),
  post: (path, options) =>
    request(() => Wreck.post(path, buildOptions(options))),
  put: (path, options) => request(() => Wreck.put(path, buildOptions(options))),
  patch: (path, options) =>
    request(() => Wreck.patch(path, buildOptions(options))),
  delete: (path, options) =>
    request(() => Wreck.delete(path, buildOptions(options)))
}
