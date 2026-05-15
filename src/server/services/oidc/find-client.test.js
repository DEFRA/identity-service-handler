import { describe, test, expect, vi, afterEach } from 'vitest'

import { redisClient } from '../../common/helpers/redis-client.js'
import * as applicationModule from '../application.js'
import * as buildClientParamsModule from './build-client-params.js'
import { findClient } from './find-client.js'

vi.mock('./build-client-params.js')

const mocks = {
  redisClient: {
    get: vi.spyOn(redisClient, 'get'),
    set: vi.spyOn(redisClient, 'set')
  },
  getApplication: vi.spyOn(applicationModule, 'get'),
  buildClientParams: vi.mocked(buildClientParamsModule.buildClientParams),
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
    mocks.redisClient.get.mockResolvedValue(JSON.stringify(clientRecord))
    mocks.buildClientParams.mockReturnValue(clientParams)
    mocks.OidcClient.mockImplementation(function (params) {
      Object.assign(this, params)
    })

    // Act
    const result = await findClient('client-1', mocks.OidcClient)

    // Assert
    expect(mocks.redisClient.get).toHaveBeenCalledWith(
      'application-cache:client-1'
    )
    expect(mocks.getApplication).not.toHaveBeenCalled()
    expect(mocks.buildClientParams).toHaveBeenCalledWith(clientRecord)
    expect(result).toMatchObject(clientParams)
  })

  test('it fetches, caches, and returns the client on a cache miss', async () => {
    // Arrange
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.redisClient.set.mockResolvedValue('OK')
    mocks.getApplication.mockResolvedValue(clientRecord)
    mocks.buildClientParams.mockReturnValue(clientParams)
    mocks.OidcClient.mockImplementation(function (params) {
      Object.assign(this, params)
    })

    // Act
    const result = await findClient('client-1', mocks.OidcClient)

    // Assert
    expect(mocks.getApplication).toHaveBeenCalledWith('client-1')
    expect(mocks.redisClient.set).toHaveBeenCalledWith(
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
    mocks.redisClient.get.mockResolvedValue(null)
    mocks.getApplication.mockResolvedValue(null)

    // Act
    const result = await findClient('unknown-client', mocks.OidcClient)

    // Assert
    expect(result).toBeUndefined()
    expect(mocks.OidcClient).not.toHaveBeenCalled()
    expect(mocks.redisClient.set).not.toHaveBeenCalled()
  })
})
