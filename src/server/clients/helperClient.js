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

export default {
  get: (path, options) => Wreck.get(path, buildOptions(options)),
  post: (path, options) => Wreck.post(path, buildOptions(options)),
  put: (path, options) => Wreck.put(path, buildOptions(options)),
  patch: (path, options) => Wreck.patch(path, buildOptions(options)),
  delete: (path, options) => Wreck.delete(path, buildOptions(options))
}
