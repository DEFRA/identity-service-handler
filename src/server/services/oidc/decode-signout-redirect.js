/**
 * Decodes a signout redirect URL from a cookie value.
 * Returns '/' if the value is missing, empty, or malformed.
 *
 * @param {string} value
 * @returns {string}
 */
export function decodeSignoutRedirect(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '/'
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return '/'
  }
}
