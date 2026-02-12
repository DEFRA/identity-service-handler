import crypto from 'node:crypto'

export function getCertificateFingerprint(cert) {
  try {
    return crypto
      .createHash('sha256')
      .update(
        Buffer.from(
          cert.replace(
            /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g,
            ''
          ),
          'base64'
        )
      )
      .digest('base64url')
  } catch (error) {
    throw new Error('Unable to extract certificate fingerprint')
  }
}

export function getCertificateJwk(cert) {
  try {
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
  } catch (error) {
    throw new Error('Unable to extract certificate JWK')
  }
}
