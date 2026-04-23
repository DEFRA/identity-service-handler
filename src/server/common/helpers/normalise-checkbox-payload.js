export const normaliseCheckboxPayload = (rawValue) => {
  const values = new Set()
  if (Array.isArray(rawValue)) {
    for (const item of rawValue) {
      values.add(item)
    }
  }

  if (typeof rawValue === 'string') {
    values.add(rawValue)
  }

  return values
}
