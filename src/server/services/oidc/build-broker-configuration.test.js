import { buildBrokerConfiguration } from './build-broker-configuration.js'

describe('buildBrokerConfiguration()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it advertises the expected response types and scopes', () => {
    // Arrange
    const userService = { getUserContext: () => {} }
    const options = {
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }

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
    const userService = { getUserContext: () => {} }
    const options = {
      cookiePassword: 'my-secret-password-123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.cookies.keys).toEqual(['my-secret-password-123456'])
  })

  test('it configures the correct TTL values', () => {
    // Arrange
    const userService = { getUserContext: () => {} }
    const options = {
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }

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
    const userService = { getUserContext: () => {} }
    const options = {
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }

    // Act
    const result = buildBrokerConfiguration(options)

    // Assert
    expect(result.routes.authorization).toBe('/authorize')
    expect(result.routes.end_session).toBe('/oidc/signout')
    expect(result.routes.userinfo).toBe('/userinfo')
  })

  test('it returns the interaction url for a given uid', () => {
    // Arrange
    const userService = { getUserContext: () => {} }
    const options = {
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }
    const interaction = { uid: 'abc-123' }

    // Act
    const result = buildBrokerConfiguration(options)
    const url = result.interactions.url(null, interaction)

    // Assert
    expect(url).toBe('/interaction/abc-123')
  })

  test('it resolves an account using the user service', async () => {
    // Arrange
    const userService = { getUserContext: () => {} }
    const mocks = { getUserContext: vi.spyOn(userService, 'getUserContext') }
    const options = {
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService
    }
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
})
