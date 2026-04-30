import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'
import { config } from '../../../config/config.js'
import * as buildGrantModule from './helpers/build-grant-from-interaction.js'

import { create } from './interactionController.js'

vi.mock('openid-client')
vi.mock('./helpers/build-grant-from-interaction.js')

const mocks = {
  randomPKCECodeVerifier: vi.mocked(randomPKCECodeVerifier),
  calculatePKCECodeChallenge: vi.mocked(calculatePKCECodeChallenge),
  randomState: vi.mocked(randomState),
  randomNonce: vi.mocked(randomNonce),
  buildAuthorizationUrl: vi.mocked(buildAuthorizationUrl),
  buildGrantFromInteraction: vi.mocked(
    buildGrantModule.buildGrantFromInteraction
  ),
  brokerProvider: {
    interactionDetails: vi.fn(),
    interactionFinished: vi.fn()
  },
  upstreamStateStore: {
    getByUid: vi.fn(),
    delByUid: vi.fn(),
    put: vi.fn()
  },
  grantSave: vi.fn(),
  h: {
    redirect: vi.fn((value) => value),
    abandon: Symbol('abandon')
  }
}

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

  test('it saves a new grant id into the consent result when no grantId exists', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: { req: {}, res: {} }
    }
    const interaction = {
      prompt: { name: 'consent' },
      grantId: undefined
    }
    const grant = { save: mocks.grantSave }
    mocks.brokerProvider.interactionDetails.mockResolvedValue(interaction)
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.buildGrantFromInteraction.mockResolvedValue(grant)
    mocks.grantSave.mockResolvedValue('grant-123')
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, mocks.h)

    // Assert
    expect(mocks.buildGrantFromInteraction).toHaveBeenCalledWith(
      mocks.brokerProvider,
      interaction
    )
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { consent: { grantId: 'grant-123' } },
      { mergeWithLastSubmission: true }
    )
    expect(result).toBe(mocks.h.abandon)
  })

  test('it saves the grant without updating the consent result when grantId exists', async () => {
    // Arrange
    const request = {
      params: { uid: 'interaction-123' },
      raw: { req: {}, res: {} }
    }
    const interaction = {
      prompt: { name: 'consent' },
      grantId: 'grant-123'
    }
    const grant = { save: mocks.grantSave }
    mocks.brokerProvider.interactionDetails.mockResolvedValue(interaction)
    mocks.upstreamStateStore.getByUid.mockResolvedValue(undefined)
    mocks.buildGrantFromInteraction.mockResolvedValue(grant)
    mocks.grantSave.mockResolvedValue(undefined)
    const handler = create({
      config,
      b2cConfiguration: {},
      brokerProvider: mocks.brokerProvider,
      upstreamStateStore: mocks.upstreamStateStore
    })

    // Act
    const result = await handler(request, mocks.h)

    // Assert
    expect(mocks.grantSave).toHaveBeenCalledTimes(1)
    expect(mocks.brokerProvider.interactionFinished).toHaveBeenCalledWith(
      request.raw.req,
      request.raw.res,
      { consent: {} },
      { mergeWithLastSubmission: true }
    )
    expect(result).toBe(mocks.h.abandon)
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
        pkceCodeVerifier: 'pkce-verifier',
        nextUrl: '/interaction/interaction-123'
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
