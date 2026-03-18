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

  test('should allow refresh tokens for clients that do not override grant types', () => {
    expect(resolveClientGrantTypes({})).toEqual([
      'authorization_code',
      'refresh_token'
    ])
  })

  test('should preserve explicitly configured client grant types', () => {
    expect(
      resolveClientGrantTypes({
        grant_types: ['authorization_code']
      })
    ).toEqual(['authorization_code'])
  })
})
