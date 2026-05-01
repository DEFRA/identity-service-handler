import crypto from 'node:crypto'
import { config } from '../../../../config/config.js'

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

function decodeBase64Pem(value) {
  return Buffer.from(value, 'base64').toString('utf8')
}

export function loadPrivateKeyJwk() {
  const privateKey = crypto.createPrivateKey(
    decodeBase64Pem(config.get('idService.oidc.signingKey'))
  )
  const jwk = privateKey.export({ format: 'jwk' })
  return {
    keys: [
      {
        ...jwk,
        use: 'sig',
        alg: 'RS256',
        kid: getCertificateFingerprint(
          decodeBase64Pem(config.get('idService.oidc.signingCert'))
        )
      }
    ]
  }
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
