import { describe, test, expect, vi, afterEach } from 'vitest'
import * as buildClientParamsModule from './build-client-params.js'
import { findClient } from './find-client.js'

vi.mock('./build-client-params.js')

const mocks = {
  buildClientParams: vi.mocked(buildClientParamsModule.buildClientParams),
  clientsServiceGet: vi.fn(),
  OidcClient: vi.fn()
}

afterEach(() => {
  vi.resetAllMocks()
})

describe('findClient()', () => {
  test('it returns undefined when the client is not found', async () => {
    // Arrange
    const clientId = 'unknown-client'
    const clientsService = { getClient: mocks.clientsServiceGet }
    mocks.clientsServiceGet.mockResolvedValue(null)

    // Act
    const result = await findClient(clientId, clientsService, mocks.OidcClient)

    // Assert
    expect(result).toBeUndefined()
    expect(mocks.OidcClient).not.toHaveBeenCalled()
  })

  test('it returns a new OidcClient instance with mapped params when the client is found', async () => {
    // Arrange
    const clientId = 'client-1'
    const clientRecord = { client_id: 'client-1', name: 'Test App' }
    const clientParams = { client_id: 'client-1', client_name: 'Test App' }
    const clientsService = { getClient: mocks.clientsServiceGet }
    mocks.clientsServiceGet.mockResolvedValue(clientRecord)
    mocks.buildClientParams.mockReturnValue(clientParams)
    mocks.OidcClient.mockImplementation(function (params) {
      Object.assign(this, params)
    })

    // Act
    const result = await findClient(clientId, clientsService, mocks.OidcClient)

    // Assert
    expect(mocks.buildClientParams).toHaveBeenCalledWith(clientRecord)
    expect(mocks.OidcClient).toHaveBeenCalledWith(clientParams)
    expect(result).toMatchObject(clientParams)
  })
})
