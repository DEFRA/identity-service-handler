import { describe, test, expect, vi, afterEach } from 'vitest'
import Provider from 'oidc-provider'
import * as handlers from './provider-event-handlers.js'
import { buildBrokerConfiguration } from './build-broker-configuration.js'
import { loadPrivateKeyJwk } from '../../common/helpers/auth/certificate-tools.js'
import { config } from '../../../config/config.js'
import { buildBrokerProvider } from './build-broker-provider.js'
import * as application from '../application.js'

vi.mock('./build-broker-configuration.js')
vi.mock('./provider-event-handlers.js')
vi.mock('../../common/helpers/auth/certificate-tools.js')
vi.mock('../application.js')

const mocks = {
  on: vi.spyOn(Provider.prototype, 'on'),
  buildBrokerConfiguration: vi.mocked(buildBrokerConfiguration),
  loadPrivateKeyJwk: vi.mocked(loadPrivateKeyJwk),
  configGet: vi.spyOn(config, 'get'),
  getApplication: vi.mocked(application.get)
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
    // Arrange
    configSetup()

    // Act
    buildBrokerProvider()

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'server_error',
      handlers.onServerError
    )
  })

  test('it registers the interaction.error handler', () => {
    // Arrange
    configSetup()

    // Act
    buildBrokerProvider()

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'interaction.error',
      handlers.onInteractionError
    )
  })

  test('it registers the authorization.error handler', () => {
    // Arrange
    configSetup()

    // Act
    buildBrokerProvider()

    // Assert
    expect(mocks.on).toHaveBeenCalledWith(
      'authorization.error',
      handlers.onAuthorizationError
    )
  })

  test('it returns a Client instance from Client.find when getApplication finds a config', async () => {
    // Arrange
    configSetup()
    const appConfig = {
      id: '1',
      name: 'Test App',
      client_id: 'client-123',
      secret: 'secret',
      tenant_name: 'tenant',
      description: 'desc',
      scopes: [],
      redirect_uri: []
    }
    mocks.getApplication.mockResolvedValue(appConfig)
    const result = buildBrokerProvider()
    const originalFind = result.Client.find
    const mockClientInstance = { client_id: 'client-123' }
    const MockClient = vi.fn().mockImplementation(function () {
      return mockClientInstance
    })
    Object.defineProperty(result, 'Client', {
      get: () => MockClient,
      configurable: true
    })
    MockClient.find = originalFind

    // Act
    const client = await MockClient.find('client-123')

    // Assert
    expect(mocks.getApplication).toHaveBeenCalledWith('client-123')
    expect(MockClient).toHaveBeenCalledWith(appConfig)
    expect(client).toBe(mockClientInstance)
  })

  test('it returns the provider instance', () => {
    // Arrange
    configSetup()

    // Act
    const result = buildBrokerProvider()

    // Assert
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
