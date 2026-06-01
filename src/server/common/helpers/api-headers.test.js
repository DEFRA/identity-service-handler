import { vi } from 'vitest'
import { config } from '../../../config/config.js'
import * as requestContext from './request-context.js'

vi.mock('@defra/hapi-tracing', () => ({ getTraceId: vi.fn() }))

import { getTraceId } from '@defra/hapi-tracing'
import { generateHeaders } from './api-headers.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  contextGet: vi.spyOn(requestContext, 'get')
}

describe('generateHeaders()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it returns headers using context values', () => {
    // Arrange
    mocks.configGet.mockReturnValue('helper-api-key')
    mocks.contextGet.mockImplementation((key) =>
      key === 'operator_id' ? 'operator-123' : 'correlation-abc'
    )
    getTraceId.mockReturnValue('trace-xyz')

    // Act
    const result = generateHeaders('helper')

    // Assert
    expect(result).toEqual({
      'x-api-key': 'helper-api-key',
      'x-operator-id': 'operator-123',
      'x-correlation-id': 'correlation-abc',
      'x-cdp-request-id': 'trace-xyz'
    })
    expect(mocks.configGet).toHaveBeenCalledWith('idService.helper.apiKey')
  })

  test('it uses the nil UUID when no operator id is in context', () => {
    // Arrange
    mocks.configGet.mockReturnValue('helper-api-key')
    mocks.contextGet.mockImplementation((key) =>
      key === 'correlation_id' ? 'correlation-abc' : null
    )
    getTraceId.mockReturnValue(null)

    // Act
    const result = generateHeaders('helper')

    // Assert
    expect(result['x-operator-id']).toBe('00000000-0000-0000-0000-000000000000')
  })

  test('it throws when no api key is found for the service', () => {
    // Arrange
    mocks.configGet.mockReturnValue(undefined)
    let error

    // Act
    try {
      generateHeaders('missing-service')
    } catch (e) {
      error = e
    }

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe('No API key found for service missing-service')
    expect(mocks.configGet).toHaveBeenCalledWith(
      'idService.missing-service.apiKey'
    )
  })
})
