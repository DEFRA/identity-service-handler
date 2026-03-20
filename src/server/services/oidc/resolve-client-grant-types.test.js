import { resolveClientGrantTypes } from './resolve-client-grant-types.js'

describe('resolveClientGrantTypes()', () => {
  test('it defaults to authorization_code only when client has no offline_access scope', () => {
    // Arrange
    const client = {}

    // Act
    const result = resolveClientGrantTypes(client)

    // Assert
    expect(result).toEqual(['authorization_code'])
  })

  test('it retains refresh_token when client has offline_access scope and explicit grant types', () => {
    // Arrange
    const client = {
      grant_types: ['authorization_code', 'refresh_token'],
      scopes: ['openid', 'offline_access']
    }

    // Act
    const result = resolveClientGrantTypes(client)

    // Assert
    expect(result).toEqual(['authorization_code', 'refresh_token'])
  })

  test('it preserves explicitly configured client grant types', () => {
    // Arrange
    const client = { grant_types: ['authorization_code'] }

    // Act
    const result = resolveClientGrantTypes(client)

    // Assert
    expect(result).toEqual(['authorization_code'])
  })

  test('it strips refresh_token from explicit grant types when client has no offline_access scope', () => {
    // Arrange
    const client = { grant_types: ['authorization_code', 'refresh_token'] }

    // Act
    const result = resolveClientGrantTypes(client)

    // Assert
    expect(result).toEqual(['authorization_code'])
  })
})
