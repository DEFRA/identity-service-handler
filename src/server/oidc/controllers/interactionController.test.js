import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'
import { config } from '../../../config/config.js'

import { create } from './interactionController.js'

vi.mock('openid-client')

function MockGrant() {
  this.addOIDCScope = mocks.addOIDCScope
  this.addOIDCClaims = mocks.addOIDCClaims
  this.addResourceScope = mocks.addResourceScope
  this.save = mocks.grantSave
}

const mocks = {
  randomPKCECodeVerifier: vi.mocked(randomPKCECodeVerifier),
  calculatePKCECodeChallenge: vi.mocked(calculatePKCECodeChallenge),
  randomState: vi.mocked(randomState),
  randomNonce: vi.mocked(randomNonce),
  buildAuthorizationUrl: vi.mocked(buildAuthorizationUrl),
  brokerProvider: {
    interactionDetails: vi.fn(),
    interactionFinished: vi.fn(),
    Grant: MockGrant
  },
  upstreamStateStore: {
    getByUid: vi.fn(),
    delByUid: vi.fn(),
    put: vi.fn()
  },
  grantFind: vi.fn(),
  grantSave: vi.fn(),
  addOIDCScope: vi.fn(),
  addOIDCClaims: vi.fn(),
  addResourceScope: vi.fn(),
  h: {
    redirect: vi.fn((value) => value),
    abandon: Symbol('abandon')
  }
}

mocks.brokerProvider.Grant.find = mocks.grantFind

describe('create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('it finishes the interaction from pending login state', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: {
        req: {},
        res: {}
      }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: { name: 'login' }
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue({
      brokerSub: 'broker-sub'
    })
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.upstreamStateStore.getByUid).toHaveBeenCalledWith(
      'interaction-123'
    )
    expect(mocks.upstreamStateStore.delByUid).toHaveBeenCalledWith(
      'interaction-123'
    )
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { login: { accountId: 'broker-sub' } },
      { mergeWithLastSubmission: false }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it completes consent using a new grant when no grant id exists', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: {
        req: {},
        res: {}
      }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: {
        name: 'consent',
        details: {
          missingOIDCScope: ['openid', 'email'],
          missingOIDCClaims: ['email'],
          missingResourceScopes: {
            api: ['read', 'write']
          }
        }
      },
      params: {
        client_id: 'client-123'
      },
      session: {
        accountId: 'broker-sub'
      },
      grantId: undefined
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.grantSave.mockResolvedValue('grant-123')

    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.addOIDCScope).toHaveBeenCalledWith('openid email')
    expect(mocks.addOIDCClaims).toHaveBeenCalledWith(['email'])
    expect(mocks.addResourceScope).toHaveBeenCalledWith('api', 'read write')
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { consent: { grantId: 'grant-123' } },
      { mergeWithLastSubmission: true }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it completes consent using an existing grant when grant id is present', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: {
        req: {},
        res: {}
      }
    }
    const h = mocks.h
    const grant = {
      addOIDCScope: mocks.addOIDCScope,
      addOIDCClaims: mocks.addOIDCClaims,
      addResourceScope: mocks.addResourceScope,
      save: mocks.grantSave
    }
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: {
        name: 'consent',
        details: {
          missingOIDCScope: ['openid', 'email'],
          missingOIDCClaims: ['email'],
          missingResourceScopes: {
            api: ['read', 'write']
          }
        }
      },
      params: {
        client_id: 'client-123'
      },
      session: {
        accountId: 'broker-sub'
      },
      grantId: 'grant-123'
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.grantFind.mockResolvedValue(grant)
    mocks.grantSave.mockResolvedValue(undefined)
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.grantFind).toHaveBeenCalledWith('grant-123')
    expect(mocks.addOIDCScope).toHaveBeenCalledWith('openid email')
    expect(mocks.addOIDCClaims).toHaveBeenCalledWith(['email'])
    expect(mocks.addResourceScope).toHaveBeenCalledWith('api', 'read write')
    expect(mocks.grantSave).toHaveBeenCalledTimes(1)
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { consent: {} },
      { mergeWithLastSubmission: true }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it completes consent without adding scopes when details are absent', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: { req: {}, res: {} }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: { name: 'consent' },
      params: { client_id: 'client-123' },
      session: { accountId: 'broker-sub' },
      grantId: undefined
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.grantSave.mockResolvedValue('grant-123')
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.addOIDCScope).not.toHaveBeenCalled()
    expect(mocks.addOIDCClaims).not.toHaveBeenCalled()
    expect(mocks.addResourceScope).not.toHaveBeenCalled()
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { consent: { grantId: 'grant-123' } },
      { mergeWithLastSubmission: true }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it skips addResourceScope when a resource entry has an empty scopes array', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: { req: {}, res: {} }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: {
        name: 'consent',
        details: {
          missingResourceScopes: { api: [] }
        }
      },
      params: { client_id: 'client-123' },
      session: { accountId: 'broker-sub' },
      grantId: undefined
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.grantSave.mockResolvedValue('grant-123')
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    await handler(request, h)

    // Assert
    expect(mocks.addResourceScope).not.toHaveBeenCalled()
  })

  test('it finishes login immediately when the user is already authenticated', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: {
        req: {},
        res: {}
      },
      auth: {
        isAuthenticated: true,
        credentials: {
          sub: 'broker-sub'
        }
      }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: { name: 'login' }
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { login: { accountId: 'broker-sub' } },
      { mergeWithLastSubmission: false }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it redirects unauthenticated users to the upstream authorisation url', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: {
        req: {},
        res: {}
      },
      auth: {
        isAuthenticated: false
      }
    }
    const h = mocks.h
    mocks.brokerProvider.interactionDetails.mockResolvedValue({
      prompt: { name: 'login' }
    })
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.randomPKCECodeVerifier.mockReturnValue('pkce-verifier')
    mocks.calculatePKCECodeChallenge.mockResolvedValue('pkce-challenge')
    mocks.randomState.mockReturnValue('state-123')
    mocks.randomNonce.mockReturnValue('nonce-123')
    mocks.buildAuthorizationUrl.mockReturnValue(
      new URL('https://b2c.example/authorize?foo=bar')
    )
    const handler = create({
      config,
      b2cConfiguration: { issuer: 'https://issuer.example' },
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, h)

    // Assert
    expect(mocks.upstreamStateStore.put).toHaveBeenCalledWith(
      'state-123',
      {
        uid: 'interaction-123',
        nonce: 'nonce-123',
        pkceCodeVerifier: 'pkce-verifier'
      },
      600
    )
    expect(mocks.buildAuthorizationUrl).toHaveBeenCalledWith(
      { issuer: 'https://issuer.example' },
      expect.objectContaining({
        redirect_uri: config.get('idService.b2c.redirectUrl'),
        scope: `openid offline_access ${config.get('idService.b2c.clientId')}`,
        state: 'state-123',
        nonce: 'nonce-123',
        response_mode: 'query',
        code_challenge: 'pkce-challenge',
        code_challenge_method: 'S256',
        serviceId: config.get('idService.b2c.serviceId')
      })
    )
    expect(mocks.h.redirect).toHaveBeenCalledWith(
      'https://b2c.example/authorize?foo=bar'
    )
    expect(result).toBe('https://b2c.example/authorize?foo=bar')
  })
})
