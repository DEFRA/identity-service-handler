import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { oidcDiscoveryController } from './oidc-discovery-controller.js'
import { config } from '../../../../config/config.js'

describe('oidcDiscoveryController', () => {
  let mockRequest
  let mockH
  let originalConfig

  beforeEach(() => {
    originalConfig = config.get('idService')

    config.set('idService', {
      identityServiceBaseUrl: 'https://example.com',
      oidcIssuer: 'https://example.com'
    })

    mockRequest = {}

    mockH = {
      response: (payload) => ({
        type: (contentType) => {
          mockH.lastContentType = contentType
          mockH.lastPayload = payload
          return mockH
        }
      }),
      lastPayload: null,
      lastContentType: null
    }
  })

  afterEach(() => {
    if (originalConfig) {
      config.set('idService', originalConfig)
    }
  })

  it('should return OIDC discovery document with correct structure', () => {
    const result = oidcDiscoveryController.handler(mockRequest, mockH)

    assert.strictEqual(mockH.lastContentType, 'application/json')
    assert.ok(mockH.lastPayload)
    assert.strictEqual(mockH.lastPayload.issuer, 'https://example.com')
    assert.strictEqual(
      mockH.lastPayload.authorization_endpoint,
      'https://example.com/login'
    )
    assert.strictEqual(
      mockH.lastPayload.end_session_endpoint,
      'https://example.com/signout'
    )
    assert.strictEqual(
      mockH.lastPayload.jwks_uri,
      'https://example.com/.well-known/jwks.json'
    )
  })

  it('should include correct response_types_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(mockH.lastPayload.response_types_supported, [
      'code',
      'id_token'
    ])
  })

  it('should include correct subject_types_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(mockH.lastPayload.subject_types_supported, [
      'public'
    ])
  })

  it('should include correct id_token_signing_alg_values_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(
      mockH.lastPayload.id_token_signing_alg_values_supported,
      ['RS256']
    )
  })

  it('should include correct scopes_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(mockH.lastPayload.scopes_supported, [
      'openid',
      'profile',
      'email'
    ])
  })

  it('should include correct token_endpoint_auth_methods_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(
      mockH.lastPayload.token_endpoint_auth_methods_supported,
      ['client_secret_post', 'client_secret_basic']
    )
  })

  it('should include correct claims_supported', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.deepStrictEqual(mockH.lastPayload.claims_supported, [
      'sub',
      'iss',
      'auth_time',
      'name',
      'given_name',
      'family_name',
      'email'
    ])
  })

  it('should strip trailing slash from baseUrl', () => {
    config.set('idService', {
      identityServiceBaseUrl: 'https://example.com/',
      oidcIssuer: 'https://example.com'
    })

    oidcDiscoveryController.handler(mockRequest, mockH)

    assert.strictEqual(
      mockH.lastPayload.authorization_endpoint,
      'https://example.com/login'
    )
    assert.strictEqual(
      mockH.lastPayload.end_session_endpoint,
      'https://example.com/signout'
    )
    assert.strictEqual(
      mockH.lastPayload.jwks_uri,
      'https://example.com/.well-known/jwks.json'
    )
  })

  it('should return all required OIDC discovery fields', () => {
    oidcDiscoveryController.handler(mockRequest, mockH)

    const requiredFields = [
      'issuer',
      'authorization_endpoint',
      'jwks_uri',
      'response_types_supported',
      'subject_types_supported',
      'id_token_signing_alg_values_supported'
    ]

    requiredFields.forEach((field) => {
      assert.ok(mockH.lastPayload[field], `Missing required field: ${field}`)
    })
  })
})
