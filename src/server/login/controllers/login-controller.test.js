import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as oidc from 'openid-client'
import { config } from '../../../config/config.js'
import { create } from './login-controller.js'

import * as crypto from 'node:crypto'

vi.mock('openid-client')
vi.mock('node:crypto', () => ({ randomUUID: vi.fn() }))

const mocks = {
  randomPKCECodeVerifier: vi.mocked(oidc.randomPKCECodeVerifier),
  calculatePKCECodeChallenge: vi.mocked(oidc.calculatePKCECodeChallenge),
  randomState: vi.mocked(oidc.randomState),
  randomNonce: vi.mocked(oidc.randomNonce),
  buildAuthorizationUrl: vi.mocked(oidc.buildAuthorizationUrl),
  randomUUID: vi.mocked(crypto.randomUUID)
}

const upstreamStateStore = { put: vi.fn() }
const b2cConfiguration = {}

function makeRequest(next) {
  return { query: { next } }
}

function makeH() {
  return {
    response: vi.fn((msg) => ({ code: vi.fn(() => msg) })),
    redirect: vi.fn((url) => url)
  }
}

describe('create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.randomPKCECodeVerifier.mockReturnValue('test-verifier')
    mocks.calculatePKCECodeChallenge.mockResolvedValue('test-challenge')
    mocks.randomState.mockReturnValue('test-state')
    mocks.randomNonce.mockReturnValue('test-nonce')
    mocks.randomUUID.mockReturnValue('00000000-0000-0000-0000-000000000001')
    mocks.buildAuthorizationUrl.mockReturnValue(
      new URL('https://b2c.example.com/authorize?foo=bar')
    )
  })

  test('returns 400 when next is missing', async () => {
    // Arrange
    const handler = create({ b2cConfiguration, upstreamStateStore })

    // Act
    const result = await handler(makeRequest(undefined), makeH())

    // Assert
    expect(result).toBe('Invalid next parameter')
  })

  test('returns 400 when next does not start with /', async () => {
    // Arrange
    const handler = create({ b2cConfiguration, upstreamStateStore })

    // Act
    const result = await handler(makeRequest('https://evil.com'), makeH())

    // Assert
    expect(result).toBe('Invalid next parameter')
  })

  test('returns 400 when next starts with //', async () => {
    // Arrange
    const handler = create({ b2cConfiguration, upstreamStateStore })

    // Act
    const result = await handler(makeRequest('//evil.com'), makeH())

    // Assert
    expect(result).toBe('Invalid next parameter')
  })

  test('stores state in upstreamStateStore and redirects to B2C', async () => {
    // Arrange
    const h = makeH()
    const handler = create({ b2cConfiguration, upstreamStateStore })

    // Act
    const result = await handler(makeRequest('/dashboard'), h)

    // Assert
    expect(upstreamStateStore.put).toHaveBeenCalledWith(
      'test-state',
      {
        uid: '00000000-0000-0000-0000-000000000001',
        nonce: 'test-nonce',
        pkceCodeVerifier: 'test-verifier',
        nextUrl: '/dashboard'
      },
      600
    )
    expect(mocks.buildAuthorizationUrl).toHaveBeenCalledWith(b2cConfiguration, {
      redirect_uri: config.get('idService.b2c.redirectUrl'),
      scope: `openid offline_access ${config.get('idService.b2c.clientId')}`,
      state: 'test-state',
      nonce: 'test-nonce',
      response_mode: 'query',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      serviceId: config.get('idService.b2c.serviceId')
    })
    expect(result).toBe('https://b2c.example.com/authorize?foo=bar')
  })
})
