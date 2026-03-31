import { describe, test, expect, vi, afterEach } from 'vitest'
import { config } from '../../../../config/config.js'
import { oidcController } from './oidc-controller.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  code: vi.fn(),
  response: vi.fn()
}

describe('oidcController', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it returns the openid configuration discovery document', () => {
    // Arrange
    mocks.configGet.mockReturnValue('https://test.example.com')
    mocks.code.mockReturnThis()
    mocks.response.mockReturnValue({ code: mocks.code })
    const h = { response: mocks.response }

    // Act
    oidcController.handler({}, h)

    // Assert
    const body = mocks.response.mock.calls[0][0]
    expect(body).toHaveProperty(
      'authorization_endpoint',
      'https://test.example.com/authorize'
    )
    expect(body).toHaveProperty(
      'end_session_endpoint',
      'https://test.example.com/signout'
    )
    expect(body).toHaveProperty('jwks_uri', 'https://test.example.com/jwks')
    expect(body).toHaveProperty(
      'token_endpoint',
      'https://test.example.com/token'
    )
    expect(body).toHaveProperty(
      'pushed_authorization_request_endpoint',
      'https://test.example.com/request'
    )
    expect(body).toHaveProperty(
      'userinfo_endpoint',
      'https://test.example.com/userinfo'
    )
    expect(mocks.code).toHaveBeenCalledWith(200)
  })
})
