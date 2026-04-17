import crypto from 'node:crypto'

export function getCertificateFingerprint(cert) {
  return crypto
    .createHash('sha256')
    .update(
      Buffer.from(
        cert.replaceAll(
          /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g,
          ''
        ),
        'base64'
      )
    )
    .digest('base64url')
}

export function getCertificateJwk(cert) {
  const publicKey = crypto.createPublicKey(cert)
  const jwk = publicKey.export({ format: 'jwk' })

  return {
    keys: [
      {
        ...jwk,
        use: 'sig',
        alg: 'RS256',
        kid: getCertificateFingerprint(cert)
      }
    ]
  }
}
