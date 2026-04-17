vi.mock('./post-logout-success-source.js', () => ({
  postLogoutSuccessSource: vi.fn()
}))

import { postLogoutSuccessSource } from './post-logout-success-source.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { RedisAdapter } from './redis-adapter.js'

function createOptions(overrides = {}) {
  return {
    cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
    sessionCookieSecure: false,
    redis: {},
    userService: { getUserContext: () => {} },
    ...overrides
  }
}

describe('buildBrokerConfiguration()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it advertises the expected response types and scopes', () => {
    // Arrange
    const options = createOptions()

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.responseTypes).toEqual(['code'])
    expect(result.scopes).toEqual([
      'openid',
      'offline_access',
      'profile',
      'email'
    ])
  })

  test('it configures cookie keys from the cookie password', () => {
    // Arrange
    const options = createOptions({
      cookiePassword: 'my-secret-password-123456'
    })

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.cookies.keys).toEqual(['my-secret-password-123456'])
  })

  test('it configures the correct TTL values', () => {
    // Arrange
    const options = createOptions()

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.ttl.AccessToken).toBe(15 * 60)
    expect(result.ttl.AuthorizationCode).toBe(2 * 60)
    expect(result.ttl.IdToken).toBe(15 * 60)
    expect(result.ttl.Session).toBe(8 * 60 * 60)
  })

  test('it configures the correct routes', () => {
    // Arrange
    const options = createOptions()

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.routes.authorization).toBe('/authorize')
    expect(result.routes.end_session).toBe('/oidc/signout')
    expect(result.routes.userinfo).toBe('/userinfo')
  })

  test('it configures the expected claims by scope', () => {
    const result = buildBrokerConfiguration(createOptions())

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
    const redis = { options: { keyPrefix: '' } }
    const result = buildBrokerConfiguration(createOptions({ redis }))
    const adapter = result.adapter('AccessToken')

    expect(adapter).toBeInstanceOf(RedisAdapter)
    expect(adapter.model).toBe('AccessToken')
    expect(adapter.redis).toBe(redis)
    expect(adapter.prefix).toBe('oidc')
  })

  test('it returns the interaction url for a given uid', () => {
    // Arrange
    const options = createOptions()
    const interaction = { uid: 'abc-123' }

    // Act
    const result = buildBrokerConfiguration(options)
    const url = result.interactions.url(null, interaction)

    // Assert
    expect(url).toBe('/interaction/abc-123')
  })

  test('it renders an auto-submitting logout page', async () => {
    const result = buildBrokerConfiguration(createOptions())
    const ctx = {}
    const form = '<form id="op.logoutForm"></form>'

    await result.features.rpInitiatedLogout.logoutSource(ctx, form)

    expect(ctx.type).toBe('html')
    expect(ctx.status).toBe(200)
    expect(ctx.body).toContain(form)
    expect(ctx.body).toContain(
      "document.getElementById('op.logoutForm')?.submit()"
    )
  })

  test('it delegates post logout success handling with the secure cookie setting', async () => {
    const result = buildBrokerConfiguration(
      createOptions({ sessionCookieSecure: true })
    )
    const ctx = {}

    await result.features.rpInitiatedLogout.postLogoutSuccessSource(ctx)

    expect(postLogoutSuccessSource).toHaveBeenCalledWith(ctx, true)
  })

  test('it resolves an account using the user service', async () => {
    // Arrange
    const userService = { getUserContext: () => {} }
    const mocks = { getUserContext: vi.spyOn(userService, 'getUserContext') }
    const options = createOptions({
      userService
    })
    const userContext = { sub: 'user-123', email: 'user@example.com' }
    mocks.getUserContext.mockResolvedValue(userContext)

    // Act
    const result = buildBrokerConfiguration(options)
    const account = await result.findAccount(null, 'user-123')
    const claims = await account.claims()

    // Assert
    expect(account.accountId).toBe('user-123')
    expect(claims).toEqual(userContext)
    expect(mocks.getUserContext).toHaveBeenCalledWith('user-123')
  })

  test('it leaves non-userinfo claims unchanged even when issuer is available', async () => {
    const userService = { getUserContext: () => {} }
    const mocks = { getUserContext: vi.spyOn(userService, 'getUserContext') }
    const options = createOptions({ userService })
    const userContext = { sub: 'user-123', email: 'user@example.com' }
    const ctx = {
      oidc: {
        provider: { issuer: 'https://issuer.example' }
      }
    }
    mocks.getUserContext.mockResolvedValue(userContext)

    const result = buildBrokerConfiguration(options)
    const account = await result.findAccount(ctx, 'user-123')
    const claims = await account.claims('id_token')

    expect(claims).toEqual(userContext)
  })

  test('it adds iss to userinfo claims', async () => {
    const userService = { getUserContext: () => {} }
    const mocks = { getUserContext: vi.spyOn(userService, 'getUserContext') }
    const options = createOptions({
      userService
    })
    const userContext = { sub: 'user-123', email: 'user@example.com' }
    const ctx = {
      oidc: {
        provider: { issuer: 'https://issuer.example' },
        client: { clientId: 'client-123' }
      }
    }
    mocks.getUserContext.mockResolvedValue(userContext)

    const result = buildBrokerConfiguration(options)
    const account = await result.findAccount(ctx, 'user-123')
    const claims = await account.claims('userinfo')

    expect(claims).toEqual({
      ...userContext,
      iss: 'https://issuer.example'
    })
  })

  test('it returns userinfo claims without iss when no issuer is available', async () => {
    const userService = { getUserContext: () => {} }
    const mocks = { getUserContext: vi.spyOn(userService, 'getUserContext') }
    const options = createOptions({ userService })
    const userContext = { sub: 'user-123', email: 'user@example.com' }
    mocks.getUserContext.mockResolvedValue(userContext)

    const result = buildBrokerConfiguration(options)
    const account = await result.findAccount({}, 'user-123')
    const claims = await account.claims('userinfo')

    expect(claims).toEqual(userContext)
  })
})
