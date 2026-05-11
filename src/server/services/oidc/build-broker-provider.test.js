import { describe, test, expect, vi, afterEach } from 'vitest'
import Provider from 'oidc-provider'
import * as handlers from './provider-event-handlers.js'
import { findClient } from './find-client.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { loadPrivateKeyJwk } from '../../common/helpers/auth/certificate-tools.js'
import { config } from '../../../config/config.js'
import { buildBrokerProvider } from './build-broker-provider.js'

vi.mock('./build-broker-configuration.js')
vi.mock('./find-client.js')
vi.mock('./provider-event-handlers.js')
vi.mock('../../common/helpers/auth/certificate-tools.js')

const mocks = {
  on: vi.spyOn(Provider.prototype, 'on'),
  buildBrokerConfiguration: vi.mocked(buildBrokerConfiguration),
  loadPrivateKeyJwk: vi.mocked(loadPrivateKeyJwk),
  configGet: vi.spyOn(config, 'get')
}

const configSetup = () => {
  mocks.configGet.mockImplementation((key) => {
    if (key === 'idService.oidc.issuer') return 'http://issuer'
    if (key === 'session.cookie.password') return 'pw'
    if (key === 'session.cookie.secure') return false
  })
}

describe('buildBrokerProvider()', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('it registers the server_error handler', () => {
    configSetup()
    buildBrokerProvider()
    expect(mocks.on).toHaveBeenCalledWith(
      'server_error',
      handlers.onServerError
    )
  })

  test('it registers the interaction.error handler', () => {
    configSetup()
    buildBrokerProvider()
    expect(mocks.on).toHaveBeenCalledWith(
      'interaction.error',
      handlers.onInteractionError
    )
  })

  test('it registers the authorization.error handler', () => {
    configSetup()
    buildBrokerProvider()
    expect(mocks.on).toHaveBeenCalledWith(
      'authorization.error',
      handlers.onAuthorizationError
    )
  })

  test('it registers Client.find using findClient', () => {
    // Arrange
    configSetup()

    // Act
    const result = buildBrokerProvider()
    result.Client.find('client-123')

    // Assert
    expect(vi.mocked(findClient)).toHaveBeenCalledWith(
      'client-123',
      result.Client
    )
  })

  test('it returns the provider instance', () => {
    configSetup()
    const result = buildBrokerProvider()
    expect(result).toBeInstanceOf(Provider)
  })

  test('it passes jwks from loadPrivateKeyJwk to buildBrokerConfiguration', () => {
    // Arrange
    configSetup()
    const jwks = {
      keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid: 'test-kid' }]
    }
    mocks.loadPrivateKeyJwk.mockReturnValue(jwks)

    // Act
    buildBrokerProvider()

    // Assert
    expect(mocks.buildBrokerConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ jwks })
    )
  })
})
