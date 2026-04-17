import { buildClientParams } from './build-client-params.js'

describe('buildClientParams()', () => {
  test('it maps client fields to OIDC params', () => {
    // Arrange
    const client = {
      client_id: 'abc-123',
      name: 'Test App',
      secret: 'secret',
      redirect_uri: ['https://example.com/callback'],
      scopes: ['openid', 'profile']
    }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.client_id).toBe('abc-123')
    expect(result.client_name).toBe('Test App')
    expect(result.client_secret).toBe('secret')
    expect(result.redirect_uris).toEqual(['https://example.com/callback'])
  })

  test('it defaults response_types to code', () => {
    // Arrange
    const client = { client_id: 'abc-123', scopes: ['openid'] }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.response_types).toEqual(['code'])
  })

  test('it defaults token_endpoint_auth_method to client_secret_post', () => {
    // Arrange
    const client = { client_id: 'abc-123', scopes: ['openid'] }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.token_endpoint_auth_method).toBe('client_secret_post')
  })

  test('it defaults post_logout_redirect_uris to empty array', () => {
    // Arrange
    const client = { client_id: 'abc-123', scopes: ['openid'] }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.post_logout_redirect_uris).toEqual([])
  })

  test('it joins scopes into a space-separated string', () => {
    // Arrange
    const client = { client_id: 'abc-123', scopes: ['openid', 'profile'] }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.scope).toBe('openid profile')
  })

  test('it defaults scope to openid when scopes is empty', () => {
    // Arrange
    const client = { client_id: 'abc-123', scopes: [] }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.scope).toBe('openid')
  })

  test('it omits scope when the client can request any broker-supported scope', () => {
    // Arrange
    const client = {
      client_id: 'abc-123',
      scopes: ['openid', 'profile'],
      allowAnyScope: true
    }

    // Act
    const result = buildClientParams(client)

    // Assert
    expect(result.scope).toBeUndefined()
  })
})
