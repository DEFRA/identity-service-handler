import { vi } from 'vitest'
import { generateHeaders } from './api-headers.js'

const mockRandomUUID = vi.fn()
const mockConfigGet = vi.fn()

vi.mock('crypto', async () => {
  const crypto = await vi.importActual('crypto')

  return {
    ...crypto,
    randomUUID: () => mockRandomUUID()
  }
})

vi.mock('../../../config/config.js', () => ({
  config: {
    get: (...args) => mockConfigGet(...args)
  }
}))

describe('#apiHeaders', () => {
  const request = {
    auth: {
      credentials: {
        sub: 'operator-123'
      }
    }
  }

  beforeEach(() => {
    mockRandomUUID.mockReset()
    mockConfigGet.mockReset()
  })

  test('Should return headers using provided correlation id', async () => {
    mockConfigGet.mockReturnValue('helper-api-key')

    const headers = await generateHeaders(
      request,
      'helper',
      'provided-correlation-id'
    )

    expect(headers).toEqual({
      'x-api-key': 'helper-api-key',
      'x-api-operator-id': 'operator-123',
      'x-api-correlation-id': 'provided-correlation-id'
    })
    expect(mockConfigGet).toHaveBeenCalledWith('idService.helper.apiKey')
    expect(mockRandomUUID).not.toHaveBeenCalled()
  })

  test('Should generate correlation id when one is not provided', async () => {
    mockConfigGet.mockReturnValue('helper-api-key')
    mockRandomUUID.mockReturnValue('generated-correlation-id')

    const headers = await generateHeaders(request, 'helper')

    expect(headers).toEqual({
      'x-api-key': 'helper-api-key',
      'x-api-operator-id': 'operator-123',
      'x-api-correlation-id': 'generated-correlation-id'
    })
    expect(mockConfigGet).toHaveBeenCalledWith('idService.helper.apiKey')
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })

  test('Should throw when api key is missing for service', async () => {
    mockConfigGet.mockReturnValue(undefined)

    await expect(generateHeaders(request, 'missing-service')).rejects.toThrow(
      'No API key found for service missing-service'
    )
    expect(mockConfigGet).toHaveBeenCalledWith(
      'idService.missing-service.apiKey'
    )
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })
})
