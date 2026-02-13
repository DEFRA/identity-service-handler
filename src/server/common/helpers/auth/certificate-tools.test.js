import { describe } from 'node:test'
import { strict as assert } from 'node:assert'
import { getCertificateJwk } from './certificate-tools.js'

const validMockCert = `-----BEGIN CERTIFICATE-----
MIIDZTCCAk2gAwIBAgIUVhzoC6lU09YzXbpenXe2EuSA3p8wDQYJKoZIhvcNAQEL
BQAwQjELMAkGA1UEBhMCVUsxDzANBgNVBAgMBkxvbmRvbjEOMAwGA1UECgwFRGVm
cmExEjAQBgNVBAMMCWxvY2FsaG9zdDAeFw0yNTEyMjMxNDQzNThaFw0yNjAxMjIx
NDQzNThaMEIxCzAJBgNVBAYTAlVLMQ8wDQYDVQQIDAZMb25kb24xDjAMBgNVBAoM
BURlZnJhMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IB
DwAwggEKAoIBAQCycVuSBjNnUB+ghmuALPXXlxjGlzYxpJukJqa4BhXjhzRiVHjZ
hpb/s9q5/QRF0y6zfbydW5RLYm9JlT4pq5cMLixitM3sNAFjcjXlzHI12+C3+tHJ
ZreI0IqHMbQrAh4gpZ2uwRi/npwac5kjO510qdS7UPWGprGB05VsD7n7PoyqTxcl
PZxGwFf2t9UVzzt1epB5bIwo0wVmU3mI89iV0kaH8sdQb0hY9/8QsedOjqAANGAT
NYVb1PjJxf08a9e8lRM8bCVSPdVZ21n3qrH9LZqZLpJJPSr+MYsp3aCWdqRmoU6Z
6dgZYdoGQTW3drLlqe9igq34G3t95FNISVm7AgMBAAGjUzBRMB0GA1UdDgQWBBSB
2kvjVD3N3zJCVryKVtlUeasFvjAfBgNVHSMEGDAWgBSB2kvjVD3N3zJCVryKVtlU
easFvjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCMwhg5FnAR
ru4pjy5zpGwSyiDlAb2CZW6rEDKMlcsVL3TjsPZiW/Gw9vVrzG8Hup85fp5cftW8
LXWb7yZk8Yo1xcCjTBRsBlCUAR2PU7HARH0vFgO8uRxpP6h/Do0AJbIT6Smc349B
pBL3EAF7sWpGawV0owOswXaNNhkXWJ6cXdAAlb0iVsgHYQGoBEUEAL2q3KiEmMAH
sLYjZ7nH0PQuVCvsOHX56TSN8v6FZSdxfLF98FiauPZ/wUpxdVCxsGi8X82v33z8
MJdox5WkaOvTt3YiGo6xo4mpSEt76h5sTNxoe0i63GauZk7XM51ywStCOp7GjK7N
cy24mrImRaij
-----END CERTIFICATE-----`

describe('certificate-tools', () => {
  describe('getCertificateJwk', () => {
    test('should convert a valid certificate to JWK format', () => {
      const result = getCertificateJwk(validMockCert)

      assert.ok(result, 'Result should be defined')
      assert.ok(result.keys, 'Result should have keys property')
      assert.ok(Array.isArray(result.keys), 'Keys should be an array')
      assert.ok(result.keys.length > 0, 'Keys array should not be empty')
      assert.strictEqual(result.keys[0].kty, 'RSA', 'Key type should be RSA')
      assert.strictEqual(result.keys[0].use, 'sig', 'Key use should be sig')
      assert.ok(result.keys[0].n, 'Should have modulus')
      assert.ok(result.keys[0].e, 'Should have exponent')
      assert.ok(result.keys[0].kid, 'Should have key ID')
    })

    test('should throw error for invalid certificate', () => {
      const invalidCert = 'invalid-certificate-data'

      assert.throws(
        () => getCertificateJwk(invalidCert),
        Error,
        'Should throw error for invalid certificate'
      )
    })

    test('should throw error for empty certificate', () => {
      assert.throws(
        () => getCertificateJwk(''),
        Error,
        'Should throw error for empty certificate'
      )
    })

    test('should throw error for null certificate', () => {
      assert.throws(
        () => getCertificateJwk(null),
        Error,
        'Should throw error for null certificate'
      )
    })

    test('should include alg field in JWK', () => {
      const result = getCertificateJwk(validMockCert)

      assert.ok(result.keys[0].alg, 'Should have algorithm field')
      assert.strictEqual(
        typeof result.keys[0].alg,
        'string',
        'Algorithm should be a string'
      )
    })
  })
})
