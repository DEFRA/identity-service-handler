import { describe, test, expect, vi, afterEach } from 'vitest'

vi.mock('../application/index.js', () => ({
  default: { get: vi.fn() }
}))

import applicationService from '../application/index.js'
import * as buildClientParamsModule from './build-client-params.js'
import { findClient } from './find-client.js'

vi.mock('./build-client-params.js')

const mocks = {
  buildClientParams: vi.mocked(buildClientParamsModule.buildClientParams),
  redis: { get: vi.fn(), set: vi.fn() },
  OidcClient: vi.fn()
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('findClient()', () => {
  const clientRecord = { client_id: 'client-1', name: 'Test App' }
  const clientParams = { client_id: 'client-1', client_name: 'Test App' }

  test('it returns the cached client when cache hits', async () => {
    // Arrange
    mocks.redis.get.mockResolvedValue(JSON.stringify(clientRecord))
    mocks.buildClientParams.mockReturnValue(clientParams)
    mocks.OidcClient.mockImplementation(function (params) {
      Object.assign(this, params)
    })

    // Act
    const result = await findClient('client-1', mocks.redis, mocks.OidcClient)

    // Assert
    expect(mocks.redis.get).toHaveBeenCalledWith('application-cache:client-1')
    expect(applicationService.get).not.toHaveBeenCalled()
    expect(mocks.buildClientParams).toHaveBeenCalledWith(clientRecord)
    expect(result).toMatchObject(clientParams)
  })

  test('it fetches, caches, and returns the client on a cache miss', async () => {
    // Arrange
    mocks.redis.get.mockResolvedValue(null)
    mocks.redis.set.mockResolvedValue('OK')
    applicationService.get.mockResolvedValue(clientRecord)
    mocks.buildClientParams.mockReturnValue(clientParams)
    mocks.OidcClient.mockImplementation(function (params) {
      Object.assign(this, params)
    })

    // Act
    const result = await findClient('client-1', mocks.redis, mocks.OidcClient)

    // Assert
    expect(applicationService.get).toHaveBeenCalledWith('client-1')
    expect(mocks.redis.set).toHaveBeenCalledWith(
      'application-cache:client-1',
      JSON.stringify(clientRecord),
      'EX',
      300
    )
    expect(mocks.buildClientParams).toHaveBeenCalledWith(clientRecord)
    expect(result).toMatchObject(clientParams)
  })

  test('it returns undefined when the client is not found', async () => {
    // Arrange
    mocks.redis.get.mockResolvedValue(null)
    applicationService.get.mockResolvedValue(null)

    // Act
    const result = await findClient(
      'unknown-client',
      mocks.redis,
      mocks.OidcClient
    )

    // Assert
    expect(result).toBeUndefined()
    expect(mocks.OidcClient).not.toHaveBeenCalled()
    expect(mocks.redis.set).not.toHaveBeenCalled()
  })
})
