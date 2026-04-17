import { describe, test, expect, vi, beforeEach } from 'vitest'
import { buildGrantFromInteraction } from './build-grant-from-interaction.js'

function MockGrant() {
  this.addOIDCScope = mocks.addOIDCScope
  this.addOIDCClaims = mocks.addOIDCClaims
  this.addResourceScope = mocks.addResourceScope
  this.save = mocks.grantSave
}

const mocks = {
  grantFind: vi.fn(),
  grantSave: vi.fn(),
  addOIDCScope: vi.fn(),
  addOIDCClaims: vi.fn(),
  addResourceScope: vi.fn()
}

const brokerProvider = {
  Grant: MockGrant
}
brokerProvider.Grant.find = mocks.grantFind

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildGrantFromInteraction()', () => {
  test('it creates a new grant when no grantId is present', async () => {
    // Arrange
    const interaction = {
      params: { client_id: 'client-123' },
      session: { accountId: 'broker-sub' },
      grantId: undefined,
      prompt: { details: {} }
    }

    // Act
    const grant = await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.grantFind).not.toHaveBeenCalled()
    expect(grant).toBeInstanceOf(MockGrant)
  })

  test('it finds an existing grant when grantId is present', async () => {
    // Arrange
    const existingGrant = { addOIDCScope: vi.fn(), save: vi.fn() }
    mocks.grantFind.mockResolvedValue(existingGrant)
    const interaction = {
      grantId: 'grant-123',
      prompt: { details: {} }
    }

    // Act
    const grant = await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.grantFind).toHaveBeenCalledWith('grant-123')
    expect(grant).toBe(existingGrant)
  })

  test('it adds OIDC scope when missingOIDCScope is non-empty', async () => {
    // Arrange
    const interaction = {
      grantId: undefined,
      prompt: { details: { missingOIDCScope: ['openid', 'email'] } }
    }

    // Act
    await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.addOIDCScope).toHaveBeenCalledWith('openid email')
  })

  test('it adds OIDC claims when missingOIDCClaims is non-empty', async () => {
    // Arrange
    const interaction = {
      grantId: undefined,
      prompt: { details: { missingOIDCClaims: ['email'] } }
    }

    // Act
    await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.addOIDCClaims).toHaveBeenCalledWith(['email'])
  })

  test('it adds resource scopes when missingResourceScopes has entries', async () => {
    // Arrange
    const interaction = {
      grantId: undefined,
      prompt: { details: { missingResourceScopes: { api: ['read', 'write'] } } }
    }

    // Act
    await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.addResourceScope).toHaveBeenCalledWith('api', 'read write')
  })

  test('it skips addResourceScope when a resource entry has an empty scopes array', async () => {
    // Arrange
    const interaction = {
      grantId: undefined,
      prompt: { details: { missingResourceScopes: { api: [] } } }
    }

    // Act
    await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.addResourceScope).not.toHaveBeenCalled()
  })

  test('it skips all grant additions when details are absent', async () => {
    // Arrange
    const interaction = {
      grantId: undefined,
      prompt: { name: 'consent' }
    }

    // Act
    await buildGrantFromInteraction(brokerProvider, interaction)

    // Assert
    expect(mocks.addOIDCScope).not.toHaveBeenCalled()
    expect(mocks.addOIDCClaims).not.toHaveBeenCalled()
    expect(mocks.addResourceScope).not.toHaveBeenCalled()
  })
})
