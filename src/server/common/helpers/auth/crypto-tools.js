import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function generateToken(token, salt) {
  const actualToken = token || randomBytes(32).toString('base64url')
  const actualSalt = salt || randomBytes(16).toString('base64url')
  const hash = hashToken(actualToken, actualSalt)
  return { hash, salt: actualSalt }
}

export function verifyToken(tokenPresented, storedSalt, storedHashHex) {
  const candidateHex = hashToken(tokenPresented, storedSalt)
  const candidate = Buffer.from(candidateHex, 'hex')
  const stored = Buffer.from(storedHashHex, 'hex')

  return (
    candidate.length === stored.length && timingSafeEqual(candidate, stored)
  )
}

export function hashToken(token, saltBase64url) {
  return createHash('sha256')
    .update(saltBase64url, 'utf8')
    .update(token, 'utf8')
    .digest('hex')
}
