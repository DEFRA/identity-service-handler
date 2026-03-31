import { describe, test, expect, vi, afterEach } from 'vitest'
import Provider from 'oidc-provider'
import * as handlers from './provider-event-handlers.js'
import { findClient } from './find-client.js'
import { buildBrokerProvider } from './build-broker-provider.js'

const mocks = {
  on: vi.spyOn(Provider.prototype, 'on')
}

vi.mock('./build-broker-configuration.js')
vi.mock('./find-client.js')
vi.mock('./provider-event-handlers.js')

describe('buildBrokerProvider()', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('it registers the server_error handler', () => {
    // Arrange
    const options = {
      cookiePassword: 'pw',
      sessionCookieSecure: false,
      issuer: 'http://issuer',
      redis: {},
      clientsService: {},
      userService: {}
    }

    // Act
    buildBrokerProvider(options)

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'server_error',
      handlers.onServerError
    )
  })

  test('it registers the interaction.error handler', () => {
    // Arrange
    const options = {
      cookiePassword: 'pw',
      sessionCookieSecure: false,
      issuer: 'http://issuer',
      redis: {},
      clientsService: {},
      userService: {}
    }

    // Act
    buildBrokerProvider(options)

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'interaction.error',
      handlers.onInteractionError
    )
  })

  test('it registers the authorization.error handler', () => {
    // Arrange
    const options = {
      cookiePassword: 'pw',
      sessionCookieSecure: false,
      issuer: 'http://issuer',
      redis: {},
      clientsService: {},
      userService: {}
    }

    // Act
    buildBrokerProvider(options)

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'authorization.error',
      handlers.onAuthorizationError
    )
  })

  test('it registers Client.find using findClient', () => {
    // Arrange
    const clientsService = { getClient: vi.fn() }
    const options = {
      cookiePassword: 'pw',
      sessionCookieSecure: false,
      issuer: 'http://issuer',
      redis: {},
      clientsService,
      userService: {}
    }

    // Act
    const result = buildBrokerProvider(options)
    result.Client.find('client-123')

    // Assert
    expect(vi.mocked(findClient)).toHaveBeenCalledWith(
      'client-123',
      clientsService,
      result.Client
    )
  })

  test('it returns the provider instance', () => {
    // Arrange
    const options = {
      cookiePassword: 'pw',
      sessionCookieSecure: false,
      issuer: 'http://issuer',
      redis: {},
      clientsService: {},
      userService: {}
    }

    // Act
    const result = buildBrokerProvider(options)

    // Assert
    expect(result).toBeInstanceOf(Provider)
  })
})
