import { generateKeyPair, exportJWK, exportPKCS8 } from 'jose'
import { randomBytes } from 'crypto'

export class ServiceFake {
  constructor({ config, request }) {
    this.config = config
    this.applications = new Map()
  }

  async init() {
    const tmp = await this.generateClientJwks()
    this.applications.set('a3d4e5f6-7890-4b1c-a2d3-e4f567890abc', {
      client_id: 'a3d4e5f6-7890-4b1c-a2d3-e4f567890abc',
      client_name: 'Test Application',
      scope: 'openid profile',
      token_endpoint_auth_method: 'client_secret_post',
      secret:
        'S!uhSylf@klNy*HyI^~7vKz9EO"ACrmRTHrL>tpl)"[^~7TPaE3^u:<XfH9HYV#S{nj#@;nje"cKF6|bq9}h^AOci`sB",$lIv3]d|6"-l!U[]U40!th|PtkIhvC0u@J',
      redirect_uris: ['https://localhost:3005/callback'],
      ...tmp
    })
  }

  async get(headers, id) {
    return this.applications.get(id)
  }

  async generateClientJwks() {
    // Generate RSA keypair
    const { publicKey, privateKey } = await generateKeyPair('RS256', {
      extractable: true
    })

    // Export public key to JWK
    const jwk = await exportJWK(publicKey)

    // Assign metadata
    jwk.kid = randomBytes(8).toString('base64url')
    jwk.use = 'sig'
    jwk.alg = 'RS256'

    const jwks = { keys: [jwk] }

    // Export private key to PEM format
    const privateKeyPem = await exportPKCS8(privateKey)

    return {
      jwks, // store in DB
      privateKeyPem // deliver once
    }
  }
}
