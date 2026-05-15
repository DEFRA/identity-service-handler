import { beforeEach, describe, expect, test, vi } from 'vitest'
import * as oidc from 'openid-client'
import { config } from '../../../config/config.js'
import { create } from './callbackController.js'
import * as stateStore from '../../upstream/state-store.js'

vi.mock('openid-client')

const mocks = {
  authorizationCodeGrant: vi.mocked(oidc.authorizationCodeGrant),
  response: vi.fn((value) => ({
    code: vi.fn(() => value)
  })),
  redirect: vi.fn((value) => value),
  stateStoreGet: vi.spyOn(stateStore, 'get'),
  stateStorePutByUid: vi.spyOn(stateStore, 'putByUid'),
  stateStoreDel: vi.spyOn(stateStore, 'del')
}

describe('create()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.stateStorePutByUid.mockResolvedValue(undefined)
    mocks.stateStoreDel.mockResolvedValue(undefined)
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
      brokerProvider: {}
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
      brokerProvider: {}
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
      brokerProvider: {}
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
      brokerProvider: {}
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
    mocks.stateStoreGet.mockResolvedValue(undefined)
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: {}
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.stateStoreGet).toHaveBeenCalledWith('test-state')
    expect(mocks.response).toHaveBeenCalledWith('Unknown/expired state')
    expect(result).toBe('Unknown/expired state')
  })

  test('it exchanges the code, stores the broker subject and redirects to the interaction', async () => {
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
    mocks.stateStoreGet.mockResolvedValue({
      uid: 'interaction-123',
      nonce: 'nonce-123',
      pkceCodeVerifier: 'verifier-123',
      nextUrl: '/interaction/interaction-123'
    })
    mocks.authorizationCodeGrant.mockResolvedValue({
      id_token: 'id-token',
      claims: () => ({ sub: 'upstream-sub' })
    })
    const handler = create({
      config,
      b2cConfiguration: { issuer: 'https://issuer.example' },
      brokerProvider: {}
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
    expect(request.cookieAuth.set).toHaveBeenCalledWith({
      sub: 'upstream-sub',
      upstreamIdTokenHint: 'id-token'
    })
    expect(request.yar.set).toHaveBeenCalledWith(
      'upstreamIdTokenHint',
      'id-token'
    )
    expect(mocks.stateStorePutByUid).toHaveBeenCalledWith(
      'interaction-123',
      { brokerSub: 'upstream-sub' },
      120
    )
    expect(mocks.stateStoreDel).toHaveBeenCalledWith('test-state')
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
    mocks.stateStoreGet.mockResolvedValue({
      uid: 'interaction-post',
      nonce: 'nonce-post',
      pkceCodeVerifier: 'verifier-post'
    })
    mocks.authorizationCodeGrant.mockResolvedValue({
      id_token: 'id-token-post',
      claims: () => ({ sub: 'upstream-post-sub' })
    })
    const handler = create({
      config,
      b2cConfiguration: { issuer: 'https://issuer.example' },
      brokerProvider: {}
    })

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.stateStoreGet).toHaveBeenCalledWith('post-state')
    const callbackUrl = mocks.authorizationCodeGrant.mock.calls[0][1]
    expect(callbackUrl.searchParams.get('code')).toBe('post-auth-code')
    expect(callbackUrl.searchParams.get('state')).toBe('post-state')
  })
})
