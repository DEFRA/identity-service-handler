import { config } from '../../../config/config.js'
import * as requestContext from './request-context.js'
import { generateHeaders } from './api-headers.js'

const mocks = {
  configGet: vi.spyOn(config, 'get'),
  contextGet: vi.spyOn(requestContext, 'get')
}

describe('generateHeaders()', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('it returns headers with the provided correlation id', async () => {
    // Arrange
    mocks.configGet.mockReturnValue('helper-api-key')
    mocks.contextGet.mockReturnValue('operator-123')

    // Act
    const result = await generateHeaders('helper', 'provided-correlation-id')

    // Assert
    expect(result).toEqual({
      'x-api-key': 'helper-api-key',
      'x-operator-id': 'operator-123',
      'x-correlation-id': 'provided-correlation-id'
    })
    expect(mocks.configGet).toHaveBeenCalledWith('idService.helper.apiKey')
  })

  test('it uses the nil UUID when no operator id is in context', async () => {
    // Arrange
    mocks.configGet.mockReturnValue('helper-api-key')
    mocks.contextGet.mockReturnValue(null)

    // Act
    const result = await generateHeaders('helper', 'provided-correlation-id')

    // Assert
    expect(result['x-operator-id']).toBe('00000000-0000-0000-0000-000000000000')
  })

  test('it generates a correlation id when one is not provided', async () => {
    // Arrange
    mocks.configGet.mockReturnValue('helper-api-key')
    mocks.contextGet.mockReturnValue('operator-123')

    // Act
    const result = await generateHeaders('helper')

    // Assert
    expect(result['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('it throws when no api key is found for the service', async () => {
    // Arrange
    mocks.configGet.mockReturnValue(undefined)
    let error

    // Act
    try {
      await generateHeaders('missing-service')
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
