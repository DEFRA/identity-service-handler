import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as oidc from 'openid-client'
import jwt from 'jsonwebtoken'
import { config } from '../../../config/config.js'
import { create } from './callbackController.js'

const mocks = {
  authorizationCodeGrant: vi.mocked(oidc.authorizationCodeGrant),
  decode: vi.mocked(jwt.decode),
  subjectsService: {
    getOrCreateBrokerSub: vi.fn()
  },
  upstreamStateStore: {
    get: vi.fn(),
    putByUid: vi.fn(),
    del: vi.fn()
  },
  response: vi.fn((value) => ({
    code: vi.fn(() => value)
  })),
  redirect: vi.fn((value) => value)
}

vi.mock('openid-client')
vi.mock('jsonwebtoken')

describe('create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it returns 400 when query is null on a get request', async () => {
    // Arrange
    const request = {
      method: 'get',
      query: null
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.response).toHaveBeenCalledWith('Missing code')
    expect(result).toBe('Missing code')
  })

  test('it returns 400 when payload is null on a post request', async () => {
    // Arrange
    const request = {
      method: 'post',
      payload: null
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.response).toHaveBeenCalledWith('Missing code')
    expect(result).toBe('Missing code')
  })

  test('it returns 400 when code is missing', async () => {
    // Arrange
    const request = {
      method: 'get',
      query: {
        state: 'test-state'
      }
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.response).toHaveBeenCalledWith('Missing code')
    expect(result).toBe('Missing code')
  })

  test('it returns 400 when state is missing', async () => {
    // Arrange
    const request = {
      method: 'get',
      query: {
        code: 'auth-code'
      }
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.response).toHaveBeenCalledWith('Missing state')
    expect(result).toBe('Missing state')
  })

  test('it returns 400 when state record is missing', async () => {
    // Arrange
    const request = {
      method: 'get',
      query: {
        code: 'auth-code',
        state: 'test-state'
      }
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    mocks.upstreamStateStore.get.mockResolvedValue(undefined)
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.upstreamStateStore.get).toHaveBeenCalledWith('test-state')
    expect(mocks.response).toHaveBeenCalledWith('Unknown/expired state')
    expect(result).toBe('Unknown/expired state')
  })

  test('it exchanges the code, stores the broker subject mapping and redirects to the interaction', async () => {
    // Arrange
    const request = {
      method: 'get',
      query: {
        code: 'auth-code',
        state: 'test-state'
      },
      cookieAuth: {
        set: vi.fn()
      },
      yar: {
        set: vi.fn()
      }
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    mocks.upstreamStateStore.get.mockResolvedValue({
      uid: 'interaction-123',
      nonce: 'nonce-123',
      pkceCodeVerifier: 'verifier-123'
    })
    mocks.authorizationCodeGrant.mockResolvedValue({
      id_token: 'id-token'
    })
    mocks.decode.mockReturnValue({
      iss: 'https://issuer.example',
      sub: 'upstream-sub',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    mocks.subjectsService.getOrCreateBrokerSub.mockResolvedValue({
      sub: 'upstream-sub',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    const handler = create({
      config,
      b2cConfiguration: { issuer: 'https://issuer.example' },
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.authorizationCodeGrant).toHaveBeenCalledWith(
      { issuer: 'https://issuer.example' },
      expect.any(URL),
      {
        pkceCodeVerifier: 'verifier-123',
        expectedState: 'test-state',
        expectedNonce: 'nonce-123'
      }
    )
    const callbackUrl = mocks.authorizationCodeGrant.mock.calls[0][1]
    expect(callbackUrl.toString()).toBe(
      `${config.get('idService.b2c.redirectUrl')}?code=auth-code&state=test-state&scope=openid+offline_access+${config.get('idService.b2c.clientId')}`
    )
    expect(mocks.decode).toHaveBeenCalledWith('id-token')
    expect(mocks.subjectsService.getOrCreateBrokerSub).toHaveBeenCalledWith({
      iss: 'https://issuer.example',
      sub: 'upstream-sub',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User'
    })
    expect(request.cookieAuth.set).toHaveBeenCalledWith({
      sub: 'upstream-sub',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      upstreamIdTokenHint: 'id-token'
    })
    expect(request.yar.set).toHaveBeenCalledWith(
      'upstreamIdTokenHint',
      'id-token'
    )
    expect(mocks.upstreamStateStore.putByUid).toHaveBeenCalledWith(
      'interaction-123',
      { brokerSub: 'upstream-sub' },
      120
    )
    expect(mocks.upstreamStateStore.del).toHaveBeenCalledWith('test-state')
    expect(mocks.redirect).toHaveBeenCalledWith('/interaction/interaction-123')
    expect(result).toBe('/interaction/interaction-123')
  })

  test('it reads callback parameters from payload for post requests', async () => {
    // Arrange
    const request = {
      method: 'post',
      payload: {
        code: 'post-auth-code',
        state: 'post-state'
      },
      query: {
        code: 'query-auth-code',
        state: 'query-state'
      },
      cookieAuth: {
        set: vi.fn()
      },
      yar: {
        set: vi.fn()
      }
    }
    const h = {
      response: mocks.response,
      redirect: mocks.redirect
    }
    mocks.upstreamStateStore.get.mockResolvedValue({
      uid: 'interaction-post',
      nonce: 'nonce-post',
      pkceCodeVerifier: 'verifier-post'
    })
    mocks.authorizationCodeGrant.mockResolvedValue({
      id_token: 'id-token-post'
    })
    mocks.decode.mockReturnValue({
      iss: 'https://issuer.example',
      sub: 'upstream-post-sub',
      email: 'post-user@example.com',
      firstName: 'Post',
      lastName: 'User'
    })
    mocks.subjectsService.getOrCreateBrokerSub.mockResolvedValue({
      sub: 'broker-post-sub',
      email: 'post-user@example.com'
    })
    const handler = create({
      config,
      b2cConfiguration: { issuer: 'https://issuer.example' },
      brokerProvider: {},
      subjectsService: mocks.subjectsService,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.upstreamStateStore.get).toHaveBeenCalledWith('post-state')
    const callbackUrl = mocks.authorizationCodeGrant.mock.calls[0][1]
    expect(callbackUrl.searchParams.get('code')).toBe('post-auth-code')
    expect(callbackUrl.searchParams.get('state')).toBe('post-state')
  })
})
