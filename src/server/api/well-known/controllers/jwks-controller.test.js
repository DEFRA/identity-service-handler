import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { jwksController } from './jwks-controller.js'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { config } from '../../../../config/config.js'

describe('jwksController', () => {
  let mockRequest
  let mockH

  const validCert = `-----BEGIN CERTIFICATE-----
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

  beforeEach(() => {
    mockRequest = {
      log: mock.fn()
    }
    mockH = {
      response: mock.fn((data) => ({
        type: mock.fn(function () {
          return this
        }),
        code: mock.fn(function () {
          return this
        }),
        _data: data
      }))
    }
  })

  afterEach(() => {
    mock.restoreAll()
  })

  it('should return JWKS with valid certificate', () => {
    mock.method(config, 'get', () => '/path/to/cert.pem')
    mock.method(fs, 'readFileSync', () => validCert)

    const result = jwksController.handler(mockRequest, mockH)

    assert.strictEqual(mockH.response.mock.calls.length, 1)
    const responseData = mockH.response.mock.calls[0].arguments[0]

    assert.ok(responseData.keys)
    assert.strictEqual(Array.isArray(responseData.keys), true)
    assert.strictEqual(responseData.keys.length, 1)
    assert.strictEqual(responseData.keys[0].use, 'sig')
    assert.strictEqual(responseData.keys[0].alg, 'RS256')
    assert.ok(responseData.keys[0].kid)
    assert.ok(result.type)
    assert.strictEqual(
      result.type.mock.calls[0].arguments[0],
      'application/json'
    )
  })

  it('should return 500 error when certificate file cannot be read', () => {
    mock.method(config, 'get', () => '/path/to/nonexistent.pem')
    mock.method(fs, 'readFileSync', () => {
      throw new Error('ENOENT: no such file or directory')
    })

    const result = jwksController.handler(mockRequest, mockH)

    assert.strictEqual(mockRequest.log.mock.calls.length, 1)
    assert.strictEqual(mockRequest.log.mock.calls[0].arguments[0], 'error')
    assert.ok(
      mockRequest.log.mock.calls[0].arguments[1].includes(
        'Failed to generate JWKS'
      )
    )

    const responseData = mockH.response.mock.calls[0].arguments[0]
    assert.strictEqual(responseData.error, 'Internal Server Error')
    assert.strictEqual(result.code.mock.calls[0].arguments[0], 500)
  })

  it('should return 500 error when certificate is invalid format', () => {
    mock.method(config, 'get', () => '/path/to/cert.pem')
    mock.method(fs, 'readFileSync', () => 'invalid certificate content')

    const result = jwksController.handler(mockRequest, mockH)

    assert.strictEqual(mockRequest.log.mock.calls.length, 1)
    assert.strictEqual(mockRequest.log.mock.calls[0].arguments[0], 'error')
    assert.ok(
      mockRequest.log.mock.calls[0].arguments[1].includes(
        'Failed to generate JWKS'
      )
    )

    const responseData = mockH.response.mock.calls[0].arguments[0]
    assert.strictEqual(responseData.error, 'Internal Server Error')
    assert.strictEqual(result.code.mock.calls[0].arguments[0], 500)
  })

  it('should include correct JWK properties in response', () => {
    mock.method(config, 'get', () => '/path/to/cert.pem')
    mock.method(fs, 'readFileSync', () => validCert)

    jwksController.handler(mockRequest, mockH)

    const responseData = mockH.response.mock.calls[0].arguments[0]
    const key = responseData.keys[0]

    assert.ok(key.kty)
    assert.ok(key.n)
    assert.ok(key.e)
    assert.strictEqual(key.use, 'sig')
    assert.strictEqual(key.alg, 'RS256')
    assert.ok(key.kid)
  })

  it('should calculate certificate thumbprint correctly', () => {
    mock.method(config, 'get', () => '/path/to/cert.pem')
    mock.method(fs, 'readFileSync', () => validCert)

    jwksController.handler(mockRequest, mockH)

    const responseData = mockH.response.mock.calls[0].arguments[0]
    const kid = responseData.keys[0].kid

    const certContent = validCert.replace(
      /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g,
      ''
    )
    const expectedThumbprint = crypto
      .createHash('sha256')
      .update(Buffer.from(certContent, 'base64'))
      .digest('base64url')

    assert.strictEqual(kid, expectedThumbprint)
  })
})
