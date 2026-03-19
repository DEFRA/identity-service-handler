import {
  buildBrokerConfiguration,
  resolveClientGrantTypes
} from './provider.js'

describe('oidc provider configuration', () => {
  test('should advertise offline access as a supported scope', () => {
    const configuration = buildBrokerConfiguration({
      cookiePassword: 'abcdefghijklmnopqrstuvwxyz123456',
      sessionCookieSecure: false,
      redis: {},
      userService: {
        getUserContext: async () => ({ sub: 'broker-sub-123' })
      }
    })

    expect(configuration.responseTypes).toEqual(['code'])
    expect(configuration.scopes).toEqual([
      'openid',
      'offline_access',
      'profile',
      'email'
    ])
  })

  test('should default to authorization_code only when client has no offline_access scope', () => {
    expect(resolveClientGrantTypes({})).toEqual(['authorization_code'])
  })

  test('should retain refresh_token when client has offline_access scope and explicit grant types', () => {
    expect(
      resolveClientGrantTypes({
        grant_types: ['authorization_code', 'refresh_token'],
        scopes: ['openid', 'offline_access']
      })
    ).toEqual(['authorization_code', 'refresh_token'])
  })

  test('should preserve explicitly configured client grant types', () => {
    expect(
      resolveClientGrantTypes({ grant_types: ['authorization_code'] })
    ).toEqual(['authorization_code'])
  })

  test('should strip refresh_token from explicit grant types when client has no offline_access scope', () => {
    expect(
      resolveClientGrantTypes({
        grant_types: ['authorization_code', 'refresh_token']
      })
    ).toEqual(['authorization_code'])
  })
})
