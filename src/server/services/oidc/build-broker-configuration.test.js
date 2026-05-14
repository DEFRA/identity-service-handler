import { afterEach, describe, expect, test, vi } from 'vitest'
import { redisClient } from '../../common/helpers/redis-client.js'
import * as userService from '../user/index.js'
import * as postLogoutModule from './post-logout-success-source.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { RedisAdapter } from './redis-adapter.js'

vi.mock('../user/index.js')
vi.mock('./post-logout-success-source.js')

redisClient.options = { keyPrefix: '' }

const mocks = {
  getUserProfile: vi.mocked(userService.getUserProfile),
  postLogoutSuccessSource: vi.mocked(postLogoutModule.postLogoutSuccessSource)
}

const makeOptions = () => ({
  cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
  sessionCookieSecure: false,
  jwks: {
    keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid: 'test-kid' }]
  }
})

const makeProfile = (id = 'user-123') => ({
  user_details: {
    id,
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User'
  },
  direct_assignments: [],
  inbound_delegations: [],
  outbound_delegations: []
})

const expectedContext = {
  sub: 'user-123',
  email: 'user@example.com',
  given_name: 'Test',
  family_name: 'User',
  display_name: 'Test User',
  primary_cph: [],
  delegated_cph: []
}

describe('buildBrokerConfiguration()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it advertises the expected response types and scopes', () => {
    const result = buildBrokerConfiguration(makeOptions())
    expect(result.responseTypes).toEqual(['code'])
    expect(result.scopes).toEqual([
      'openid',
      'offline_access',
      'profile',
      'email'
    ])
  })

  test('it passes jwks through to the configuration', () => {
    const jwks = {
      keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid: 'test-kid' }]
    }
    const result = buildBrokerConfiguration({ ...makeOptions(), jwks })
    expect(result.jwks).toBe(jwks)
  })

  test('it configures cookie keys from the cookie password', () => {
    const result = buildBrokerConfiguration({
      ...makeOptions(),
      cookiePassword: 'my-secret-password-123456'
    })
    expect(result.cookies.keys).toEqual(['my-secret-password-123456'])
  })

  test('it configures the correct TTL values', () => {
    const result = buildBrokerConfiguration(makeOptions())
    expect(result.ttl.AccessToken).toBe(15 * 60)
    expect(result.ttl.AuthorizationCode).toBe(2 * 60)
    expect(result.ttl.IdToken).toBe(15 * 60)
    expect(result.ttl.Session).toBe(8 * 60 * 60)
  })

  test('it configures the correct routes', () => {
    const result = buildBrokerConfiguration(makeOptions())
    expect(result.routes.authorization).toBe('/authorize')
    expect(result.routes.end_session).toBe('/oidc/signout')
    expect(result.routes.userinfo).toBe('/userinfo')
  })

  test('it configures the expected claims by scope', () => {
    const result = buildBrokerConfiguration(makeOptions())
    expect(result.claims).toEqual({
      openid: ['sub', 'iss'],
      profile: [
        'given_name',
        'family_name',
        'display_name',
        'primary_cph',
        'delegated_cph'
      ],
      email: ['email']
    })
  })

  test('it creates a redis adapter for oidc models', () => {
    const result = buildBrokerConfiguration(makeOptions())
    const adapter = result.adapter('AccessToken')
    expect(adapter).toBeInstanceOf(RedisAdapter)
    expect(adapter.model).toBe('AccessToken')
    expect(adapter.redis).toBe(redisClient)
    expect(adapter.prefix).toBe('oidc')
  })

  test('it returns the interaction url for a given uid', () => {
    const result = buildBrokerConfiguration(makeOptions())
    const url = result.interactions.url(null, { uid: 'abc-123' })
    expect(url).toBe('/interaction/abc-123')
  })

  test('it renders an auto-submitting logout page', async () => {
    // Arrange
    const ctx = {}
    const form = '<form id="op.logoutForm"></form>'

    // Act
    const result = buildBrokerConfiguration(makeOptions())
    await result.features.rpInitiatedLogout.logoutSource(ctx, form)

    // Assert
    expect(ctx.type).toBe('html')
    expect(ctx.status).toBe(200)
    expect(ctx.body).toContain(
      '<form id="op.logoutForm"><input type="hidden" name="logout" value="yes"></form>'
    )
    expect(ctx.body).toContain(
      "document.getElementById('op.logoutForm')?.submit()"
    )
  })

  test('it delegates post logout success handling with the secure cookie setting', async () => {
    // Arrange
    const ctx = {}

    // Act
    const result = buildBrokerConfiguration({
      ...makeOptions(),
      sessionCookieSecure: true
    })
    await result.features.rpInitiatedLogout.postLogoutSuccessSource(ctx)

    // Assert
    expect(mocks.postLogoutSuccessSource).toHaveBeenCalledWith(ctx, true)
  })

  test('it resolves an account using the user service', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    const result = buildBrokerConfiguration(makeOptions())

    // Act
    const account = await result.findAccount(null, 'user-123')
    const claims = await account.claims()

    // Assert
    expect(account.accountId).toBe('user-123')
    expect(claims).toEqual(expectedContext)
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-123')
  })

  test('it leaves non-userinfo claims unchanged even when issuer is available', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    const ctx = { oidc: { provider: { issuer: 'https://issuer.example' } } }
    const result = buildBrokerConfiguration(makeOptions())

    // Act
    const account = await result.findAccount(ctx, 'user-123')
    const claims = await account.claims('id_token')

    // Assert
    expect(claims).toEqual(expectedContext)
  })

  test('it adds iss to userinfo claims', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    const ctx = {
      oidc: {
        provider: { issuer: 'https://issuer.example' },
        client: { clientId: 'client-123' }
      }
    }
    const result = buildBrokerConfiguration(makeOptions())

    // Act
    const account = await result.findAccount(ctx, 'user-123')
    const claims = await account.claims('userinfo')

    // Assert
    expect(claims).toEqual({
      ...expectedContext,
      iss: 'https://issuer.example'
    })
  })

  test('it returns userinfo claims without iss when no issuer is available', async () => {
    // Arrange
    mocks.getUserProfile.mockResolvedValue(makeProfile())
    const result = buildBrokerConfiguration(makeOptions())

    // Act
    const account = await result.findAccount({}, 'user-123')
    const claims = await account.claims('userinfo')

    // Assert
    expect(claims).toEqual(expectedContext)
  })
})
