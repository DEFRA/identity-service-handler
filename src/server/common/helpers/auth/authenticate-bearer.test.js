import { describe, test, expect, vi, afterEach } from 'vitest'
import * as jose from 'jose'
import { authenticateBearer } from './authenticate-bearer.js'

vi.mock('jose')

const mocks = {
  authenticated: vi.fn(),
  unauthorized: vi.fn(),
  jwtVerify: vi.mocked(jose.jwtVerify),
  accessTokenFind: vi.fn()
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('authenticateBearer()', () => {
  test('it throws unauthorized when authorization header is missing', async () => {
    // Arrange
    const req = { headers: {} }
    const h = { unauthorized: mocks.unauthorized }
    mocks.unauthorized.mockReturnValue(new Error('unauthorized'))

    // Act
    let error
    try {
      await authenticateBearer(req, h, {}, {})
    } catch (err) {
      error = err
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('unauthorized')
  })

  test('it throws unauthorized when authorization header does not start with Bearer', async () => {
    // Arrange
    const req = { headers: { authorization: 'Basic abc123' } }
    const h = { unauthorized: mocks.unauthorized }
    mocks.unauthorized.mockReturnValue(new Error('unauthorized'))

    // Act
    let error
    try {
      await authenticateBearer(req, h, {}, {})
    } catch (err) {
      error = err
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('unauthorized')
  })

  test('it returns authenticated credentials when JWT is valid', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer valid-token' } }
    const h = { authenticated: mocks.authenticated }
    const jwks = {}
    mocks.jwtVerify.mockResolvedValue({ payload: { sub: 'user-1' } })
    mocks.authenticated.mockReturnValue({ credentials: { sub: 'user-1' } })

    // Act
    await authenticateBearer(req, h, jwks, {})

    // Assert
    expect(mocks.authenticated).toHaveBeenCalledWith({
      credentials: { sub: 'user-1' }
    })
  })

  test('it throws unauthorized when JWT verification succeeds but payload has no sub', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer no-sub-token' } }
    const h = {
      authenticated: mocks.authenticated,
      unauthorized: mocks.unauthorized
    }
    const brokerProvider = { AccessToken: { find: mocks.accessTokenFind } }
    mocks.jwtVerify.mockResolvedValue({ payload: {} })
    mocks.accessTokenFind.mockResolvedValue(null)
    mocks.unauthorized.mockReturnValue(new Error('unauthorized'))

    // Act
    let error
    try {
      await authenticateBearer(req, h, {}, brokerProvider)
    } catch (err) {
      error = err
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('unauthorized')
  })

  test('it falls back to brokerProvider when JWT verification fails', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer fallback-token' } }
    const h = { authenticated: mocks.authenticated }
    const brokerProvider = { AccessToken: { find: mocks.accessTokenFind } }
    mocks.jwtVerify.mockRejectedValue(new Error('invalid jwt'))
    mocks.accessTokenFind.mockResolvedValue({
      accountId: 'user-2',
      isExpired: false
    })
    mocks.authenticated.mockReturnValue({ credentials: { sub: 'user-2' } })

    // Act
    await authenticateBearer(req, h, {}, brokerProvider)

    // Assert
    expect(mocks.authenticated).toHaveBeenCalledWith({
      credentials: { sub: 'user-2' }
    })
  })

  test('it throws unauthorized when JWT fails and access token is expired', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer bad-token' } }
    const h = { unauthorized: mocks.unauthorized }
    const brokerProvider = { AccessToken: { find: mocks.accessTokenFind } }
    mocks.jwtVerify.mockRejectedValue(new Error('invalid jwt'))
    mocks.accessTokenFind.mockResolvedValue({
      accountId: 'user-2',
      isExpired: true
    })
    mocks.unauthorized.mockReturnValue(new Error('unauthorized'))

    // Act
    let error
    try {
      await authenticateBearer(req, h, {}, brokerProvider)
    } catch (err) {
      error = err
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('unauthorized')
  })

  test('it throws unauthorized when JWT fails and access token has no accountId', async () => {
    // Arrange
    const req = { headers: { authorization: 'Bearer bad-token' } }
    const h = { unauthorized: mocks.unauthorized }
    const brokerProvider = { AccessToken: { find: mocks.accessTokenFind } }
    mocks.jwtVerify.mockRejectedValue(new Error('invalid jwt'))
    mocks.accessTokenFind.mockResolvedValue(null)
    mocks.unauthorized.mockReturnValue(new Error('unauthorized'))

    // Act
    let error
    try {
      await authenticateBearer(req, h, {}, brokerProvider)
    } catch (err) {
      error = err
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('unauthorized')
  })
})
