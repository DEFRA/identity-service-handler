import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  getCertificateFingerprint,
  getCertificateJwk,
  loadPrivateKeyJwk
} from './certificate-tools.js'
import { config } from '../../../../config/config.js'

describe('certificate-tools', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getCertificateJwk', () => {
    test('should convert a valid certificate to JWK format', () => {
      // Arrange
      const cert = getMockCert()

      // Act
      const result = getCertificateJwk(cert)

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result.keys)).toBe(true)
      expect(result.keys.length).toBeGreaterThan(0)
      expect(result.keys[0].kty).toBe('RSA')
      expect(result.keys[0].use).toBe('sig')
      expect(result.keys[0].n).toBeTruthy()
      expect(result.keys[0].e).toBeTruthy()
      expect(result.keys[0].kid).toBeTruthy()
    })

    test('should include alg field in JWK', () => {
      // Arrange
      const cert = getMockCert()
      // Act
      const result = getCertificateJwk(cert)

      // Assert
      expect(result.keys[0].alg).toBeTruthy()
      expect(typeof result.keys[0].alg).toBe('string')
    })

    test('should throw error for invalid certificate', () => {
      // Arrange
      const cert = 'invalid-certificate-data'

      // Act
      let error
      try {
        getCertificateJwk(cert)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    test('should throw error for empty certificate', () => {
      // Arrange
      const cert = ''

      // Act
      let error
      try {
        getCertificateJwk(cert)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    test('should throw error for null certificate', () => {
      // Arrange
      const cert = null

      // Act
      let error
      try {
        getCertificateJwk(cert)
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('loadPrivateKeyJwk', () => {
    test('returns a valid private key JWK', () => {
      // Arrange
      vi.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'idService.oidc.signingKey') return getMockKeyBase64()
        if (key === 'idService.oidc.signingCert') return getMockCertBase64()
      })

      // Act
      const result = loadPrivateKeyJwk()

      // Assert
      expect(Array.isArray(result.keys)).toBe(true)
      expect(result.keys.length).toBe(1)
      expect(result.keys[0].kty).toBe('RSA')
      expect(result.keys[0].use).toBe('sig')
      expect(result.keys[0].alg).toBe('RS256')
      expect(result.keys[0].kid).toBeTruthy()
      expect(result.keys[0].d).toBeTruthy()
    })

    test('kid matches the certificate fingerprint', () => {
      // Arrange
      vi.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'idService.oidc.signingKey') return getMockKeyBase64()
        if (key === 'idService.oidc.signingCert') return getMockCertBase64()
      })

      // Act
      const result = loadPrivateKeyJwk()

      // Assert
      expect(result.keys[0].kid).toBe(getCertificateFingerprint(getMockCert()))
    })

    test('throws when the private key is invalid', () => {
      // Arrange
      vi.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'idService.oidc.signingKey') return getMockCertBase64()
        if (key === 'idService.oidc.signingCert') return getMockCertBase64()
      })

      // Act
      let error
      try {
        loadPrivateKeyJwk()
      } catch (e) {
        error = e
      }

      // Assert
      expect(error).toBeInstanceOf(Error)
    })
  })
})

function getMockCertBase64() {
  return Buffer.from(getMockCert()).toString('base64')
}

function getMockKeyBase64() {
  return Buffer.from(getMockKey()).toString('base64')
}

function getMockCert() {
  return `-----BEGIN CERTIFICATE-----
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
}

function getMockKey() {
  return `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDWGYfVSGIbozFS
mho8JF4S/6WKUgG7cXwutcguE8gnfVdIxKx78w6T7RNLUAmGe7j+rgF9R4pqPqHu
2Esx8Hs1TJRMNI24eUR9ZDiQFYV0zzzGkFZl6ANsMm98EnLm82QG7RTygK4zN56n
3tPsxvrxfoH2qgQzrBhK81Xd9RhS2qbg/QyR8gceCBM0GzsKBMwnpeWYFlgIinfz
xWTh8YYhFiTkSqdPSpk4FR4VYO07P0Zph+eiX4+WZLTv1totzoRQ9JFEh53sSDAs
q+0AhJsl4rwuFf7mpzRJN6wiFnvFJRHO/HQwQb5rTf0MOsRajRzfyucxNyVqDKNz
spu82gLbAgMBAAECggEAMlStJHwQKDwcd7UnbrUD8oZrtZEivBxpG5f7V62p03K5
Rq+JdtgEOM02SHGn05gZPLHOQtPDG8fejIYHY1WLuVNn12RRXqkPa0TYsTKF/ZhM
Ssear/kzeMeAgtPZdCaKgMBSONH8Yaj1ILSW8GY0jvn09nYwZ69QxKngqT2Zerxj
AzKLK3HvL50VJSc1XrBOxwQ6lArJ6RNJma0JZ7phKvSjoumwggPf8al3DV8e9XyI
3/AI3mDnTmXfhKVftE8CGwiNQybiF1cewN6zacPLnqKATdJyX4UCNP9HQZaXydCU
J3tNZDEvS0h3MDW8HygTVtKIGYRUNBzLeuYpCemRuQKBgQDssNAroz8/+YhPvX9l
btIx6dLvtcVUY+SAMHYv5RbBrC/8ypWrLFynhb//oVprrmmhf7UJIDRm7qzrAmXh
2ce3nn1M9App4KrBxODTzRrJybgSfIh2oEyYLMMhA+6bRhy11h0a2K2Jj9ikwaaW
174XMQxUiJeCbxb/DlP+XzTtUwKBgQDnkOozCthBAZVpDL1wy+Wz2akYDzUw4ApL
ZMjyBxXj4YPejBauoEKlj1ClRdZc6uZe8Txxx96lTDvKYlbVwT4M6Q5rxl8XJVNF
WLkbRSf6NmdpznxwbC7dDDzoWru02tk8W8g2eyc+sdagOHwg3iMiYXjgeOkvcHyy
zJRthq1bWQKBgQDZ3CnQcNOQLDvWweLYV3gsL0BUGijG86dogrLWhPQ8UiRdd47p
3sxt+gNu5XLX+NMLrwPQoY76S6hoLG3gw9c74SsOQPaw2/XwoyoaagjFQeInSe9F
2WiHDXSSGA9xZsiYaruhcV3SZ9AOXpza7TvwFtp1mMB0c5JkNCkF01ZhNwKBgQCj
9WyN9XjHFlr3BYlAy2352PysR2BPGeLQHS1WiQPL1Upskd4hiOGHniDo1LkCE2RI
ByDYIz+W5JJVKyn2sZvAwmdukgeUON5r9HUkROQYetrgBM8BPugzpU2e61eKp4Y3
AXmSccKI1pxz12q0TvSrjD5tGc9pwojYhJf3sOsgCQKBgQCO3mtdu04Ylx6N645E
C2fIumrkx32IJQ9e+X6GAIxPFPuSlsXeQ2UwmmWh/NgPq0bVGY4mY53BjRhAHx5c
02Bj8ZEe+3m9nQaxvthhOj96wwnbo71IzfvjAYVgborq9yZTCPy+zL+05EcdEuem
n2p/kzfMTsxcuw6H9YtrBqmeNw==
-----END PRIVATE KEY-----`
}
