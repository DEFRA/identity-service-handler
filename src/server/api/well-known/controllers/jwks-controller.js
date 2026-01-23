import { config } from '../../../../config/config.js'
import fs from 'node:fs'
import crypto from 'node:crypto'

export const jwksController = {
  handler: (request, h) => {
    try {
      const certPath = config.get('tls.cert')
      const cert = fs.readFileSync(certPath, 'utf8')
      const publicKey = crypto.createPublicKey(cert)
      const jwk = publicKey.export({ format: 'jwk' })

      const certThumbprint = crypto
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

      const response = {
        keys: [
          {
            ...jwk,
            use: 'sig',
            alg: 'RS256',
            kid: certThumbprint
          }
        ]
      }

      return h.response(response).type('application/json')
    } catch (err) {
      request.log('error', `Failed to generate JWKS: ${err.message}`)
      return h.response({ error: 'Internal Server Error' }).code(500)
    }
  }
}
