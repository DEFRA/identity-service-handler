import { getTraceId } from '@defra/hapi-tracing'

export const mixin = () => {
  const mixinValues = {}
  const traceId = getTraceId()
  if (traceId) {
    mixinValues.trace = { id: traceId }
  }
  return mixinValues
}
