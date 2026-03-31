export function validateSession(req, session) {
  if (!session?.sub) return { isValid: false }
  return { isValid: true, credentials: { sub: session.sub } }
}
