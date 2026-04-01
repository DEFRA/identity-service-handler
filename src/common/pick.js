export function pick(obj, ...keys) {
  const result = {}
  for (const k of keys) {
    if (k in obj) result[k] = obj[k]
  }
  return result
}
